<?php
/**
 * Plugin Name: StaticLaunch Connector
 * Description: Conecta WordPress con StaticLaunch para inyectar landing pages estáticas
 * Version: 1.1.0
 * Author: BrandGen
 * Text Domain: staticlaunch-connector
 * License: GPL2
 */

if (!defined('ABSPATH'))
    exit;

class StaticLaunch_Connector
{

    private $option_group = 'staticlaunch_settings';
    private $option_name = 'staticlaunch_options';
    private $transient_name = 'staticlaunch_license_status';
    private $projects_transient = 'staticlaunch_projects';

    public function __construct()
    {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('template_redirect', [$this, 'intercept_slug']);
        add_action('wp_ajax_staticlaunch_sync', [$this, 'ajax_sync']);
        add_action('wp_ajax_staticlaunch_get_pages', [$this, 'ajax_get_pages']);
        add_action('admin_enqueue_scripts', [$this, 'admin_styles']);

        // Scheduled sync (optional - daily)
        add_action('staticlaunch_daily_sync', [$this, 'daily_sync']);

        // Add rewrite rules for landings
        add_action('init', [$this, 'add_rewrite_rules']);
    }

    /**
     * Add rewrite rules for clean URLs
     */
    public function add_rewrite_rules()
    {
        $options = get_option($this->option_name, []);
        $base = $options['base_slug'] ?? 'landing';

        add_rewrite_rule(
            '^' . $base . '/([^/]+)/?$',
            'index.php?staticlaunch_landing=$matches[1]',
            'top'
        );

        add_rewrite_tag('%staticlaunch_landing%', '([^/]+)');
    }

    /**
     * Admin Menu
     */
    public function add_admin_menu()
    {
        add_menu_page(
            'StaticLaunch',
            'StaticLaunch',
            'manage_options',
            'staticlaunch',
            [$this, 'render_settings_page'],
            'dashicons-rocket',
            80
        );
    }

    /**
     * Register Settings
     */
    public function register_settings()
    {
        register_setting($this->option_group, $this->option_name, [
            'sanitize_callback' => [$this, 'sanitize_options']
        ]);

        add_settings_section(
            'staticlaunch_main',
            'Configuración de Conexión',
            null,
            'staticlaunch'
        );

        add_settings_field('api_url', 'URL del Backend', function () {
            $options = get_option($this->option_name, []);
            echo '<input type="url" name="' . $this->option_name . '[api_url]" value="' . esc_attr($options['api_url'] ?? '') . '" class="regular-text" placeholder="https://tu-servidor.com" />';
        }, 'staticlaunch', 'staticlaunch_main');

        add_settings_field('license_key', 'Clave de Licencia', function () {
            $options = get_option($this->option_name, []);
            echo '<input type="text" name="' . $this->option_name . '[license_key]" value="' . esc_attr($options['license_key'] ?? '') . '" class="regular-text" placeholder="SL-XXXX-XXXX" />';
        }, 'staticlaunch', 'staticlaunch_main');

        add_settings_field('base_slug', 'Slug Base', function () {
            $options = get_option($this->option_name, []);
            $base = $options['base_slug'] ?? 'landing';
            echo '<input type="text" name="' . $this->option_name . '[base_slug]" value="' . esc_attr($base) . '" class="regular-text" placeholder="landing" />';
            echo '<p class="description">Las landing pages estarán en: tu-sitio.com/<strong>' . esc_html($base) . '</strong>/nombre-proyecto</p>';
        }, 'staticlaunch', 'staticlaunch_main');

        add_settings_field('auto_sync', 'Sincronización Automática', function () {
            $options = get_option($this->option_name, []);
            $checked = checked($options['auto_sync'] ?? false, true, false);
            echo '<label><input type="checkbox" name="' . $this->option_name . '[auto_sync]" value="1" ' . $checked . ' />';
            echo ' Habilitar sincronización automática diaria</label>';
            echo '<p class="description">Sincroniza las landings automáticamente cada día</p>';
        }, 'staticlaunch', 'staticlaunch_main');
    }

    public function sanitize_options($input)
    {
        return [
            'api_url' => esc_url_raw(rtrim($input['api_url'] ?? '', '/')),
            'license_key' => sanitize_text_field($input['license_key'] ?? ''),
            'base_slug' => sanitize_title($input['base_slug'] ?? 'landing'),
            'auto_sync' => !empty($input['auto_sync']) ? 1 : 0,
        ];
    }

    /**
     * Settings Page
     */
    public function render_settings_page()
    {
        $options = get_option($this->option_name, []);
        $license_status = get_transient($this->transient_name);
        $cached_projects = get_transient($this->projects_transient);
        ?>
        <div class="wrap staticlaunch-wrap">
            <h1>🚀 StaticLaunch Connector</h1>

            <form method="post" action="options.php">
                <?php
                settings_fields($this->option_group);
                do_settings_sections('staticlaunch');
                submit_button('Guardar Configuración');
                ?>
            </form>

            <hr>

            <h2>Estado de Conexión</h2>
            <?php if ($license_status === 'active'): ?>
                <p style="color: #00c853;">✅ Conexión activa y verificada</p>
            <?php elseif ($license_status === 'suspended'): ?>
                <p style="color: #ff1744;">❌ Usuario suspendido. Contacta al administrador.</p>
            <?php elseif ($license_status === 'invalid'): ?>
                <p style="color: #ff1744;">❌ Licencia inválida o expirada</p>
            <?php else: ?>
                <p style="color: #ff9800;">⚠️ No verificada aún</p>
            <?php endif; ?>

            <div class="staticlaunch-actions">
                <button id="sl-verify-license" class="button button-secondary">Verificar Licencia</button>
                <button id="sl-sync-pages" class="button button-primary" <?php echo $license_status !== 'active' ? 'disabled' : ''; ?>>
                    🔄 Sincronizar Landing Pages
                </button>
            </div>

            <hr>

            <h2>Landing Pages Sincronizadas</h2>
            <?php if (!empty($cached_projects)): ?>
                <table class="widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Slug</th>
                            <th>Tipo</th>
                            <th>Última Actualización</th>
                            <th>URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($cached_projects as $project): ?>
                            <tr>
                                <td><?php echo esc_html($project['name']); ?></td>
                                <td><code><?php echo esc_html($project['slug']); ?></code></td>
                                <td><?php echo esc_html($project['structureType']); ?></td>
                                <td><?php echo esc_html(date('d/m/Y H:i', strtotime($project['updatedAt']))); ?></td>
                                <td><a href="<?php echo esc_url($this->get_landing_url($project['slug'])); ?>" target="_blank">Ver →</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <p><em>Total: <?php echo count($cached_projects); ?> landing pages</em></p>
            <?php else: ?>
                <p>No hay landing pages sincronizadas. Haz clic en "Sincronizar Landing Pages" para descargar tus landings.</p>
            <?php endif; ?>

            <div id="sl-sync-log" style="margin-top:20px;"></div>

            <script>
                document.getElementById('sl-verify-license').addEventListener('click', async function (e) {
                    e.preventDefault();
                    const btn = this;
                    btn.disabled = true;
                    btn.textContent = 'Verificando...';
                    try {
                        const res = await fetch(ajaxurl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'action=staticlaunch_sync&task=verify'
                        });
                        const data = await res.json();
                        if (data.success) {
                            alert('✅ ' + data.data);
                            location.reload();
                        } else {
                            alert('❌ ' + data.data);
                        }
                    } catch (err) {
                        alert('Error de conexión');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = 'Verificar Licencia';
                    }
                });

                document.getElementById('sl-sync-pages').addEventListener('click', async function (e) {
                    e.preventDefault();
                    const btn = this;
                    const log = document.getElementById('sl-sync-log');
                    btn.disabled = true;
                    btn.textContent = 'Sincronizando...';
                    log.innerHTML = '<p>⏳ Descargando landing pages...</p>';
                    try {
                        const res = await fetch(ajaxurl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'action=staticlaunch_sync&task=sync'
                        });
                        const data = await res.json();
                        if (data.success) {
                            log.innerHTML = '<p style="color:#00c853;">✅ ' + data.data + '</p>';
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            log.innerHTML = '<p style="color:#ff1744;">❌ ' + data.data + '</p>';
                        }
                    } catch (err) {
                        log.innerHTML = '<p style="color:#ff1744;">❌ Error de conexión</p>';
                    } finally {
                        btn.disabled = false;
                        btn.textContent = '🔄 Sincronizar Landing Pages';
                    }
                });
            </script>
        </div>
        <?php
    }

    /**
     * Get landing URL helper
     */
    private function get_landing_url($slug)
    {
        $options = get_option($this->option_name, []);
        $base = $options['base_slug'] ?? 'landing';
        return get_site_url() . '/' . $base . '/' . $slug;
    }

    /**
     * AJAX Handler
     */
    public function ajax_sync()
    {
        if (!current_user_can('manage_options'))
            wp_send_json_error('Sin permisos');

        $options = get_option($this->option_name, []);
        $task = sanitize_text_field($_POST['task'] ?? '');

        // Verify license task
        if ($task === 'verify') {
            $response = wp_remote_post($options['api_url'] . '/api/license/verify', [
                'body' => json_encode(['key' => $options['license_key']]),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-Forwarded-Host' => $_SERVER['HTTP_HOST'] ?? ''
                ],
                'timeout' => 15,
            ]);

            if (is_wp_error($response)) {
                wp_send_json_error('Error de conexión: ' . $response->get_error_message());
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);

            if (!empty($body['valid'])) {
                set_transient($this->transient_name, 'active', DAY_IN_SECONDS);
                wp_send_json_success('Licencia verificada correctamente');
            } else {
                $error_msg = $body['error'] ?? 'Licencia inválida';

                // Check for suspended user
                if (strpos($error_msg, 'suspendido') !== false || strpos($error_msg, 'Usuario') !== false) {
                    set_transient($this->transient_name, 'suspended', HOUR_IN_SECONDS);
                } else {
                    set_transient($this->transient_name, 'invalid', HOUR_IN_SECONDS);
                }

                wp_send_json_error($error_msg);
            }
        }

        // Sync projects task
        if ($task === 'sync') {
            $license_key = $options['license_key'];

            // First verify license is still valid
            $verify_response = wp_remote_post($options['api_url'] . '/api/license/verify', [
                'body' => json_encode(['key' => $license_key]),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-Forwarded-Host' => $_SERVER['HTTP_HOST'] ?? ''
                ],
                'timeout' => 15,
            ]);

            if (is_wp_error($verify_response)) {
                wp_send_json_error('Error de verificación: ' . $verify_response->get_error_message());
            }

            $verify_body = json_decode(wp_remote_retrieve_body($verify_response), true);
            if (empty($verify_body['valid'])) {
                set_transient($this->transient_name, 'invalid', HOUR_IN_SECONDS);
                wp_send_json_error('Licencia no válida. Sincronización cancelada.');
            }

            set_transient($this->transient_name, 'active', DAY_IN_SECONDS);

            // Get all projects for this license
            $response = wp_remote_get($options['api_url'] . '/api/license/projects', [
                'headers' => [
                    'X-License-Key' => $license_key,
                    'X-Forwarded-Host' => $_SERVER['HTTP_HOST'] ?? ''
                ],
                'timeout' => 30,
            ]);

            if (is_wp_error($response)) {
                wp_send_json_error('Error: ' . $response->get_error_message());
            }

            $data = json_decode(wp_remote_retrieve_body($response), true);

            if (!empty($data['error'])) {
                wp_send_json_error($data['error']);
            }

            $projects = $data['projects'] ?? [];

            if (empty($projects)) {
                wp_send_json_error('No hay proyectos para sincronizar. Asegúrate de tener landing pages generadas.');
            }

            $upload_dir = wp_upload_dir();
            $sl_dir = $upload_dir['basedir'] . '/staticlaunch';
            if (!file_exists($sl_dir))
                wp_mkdir_p($sl_dir);

            $count = 0;
            $project_list = [];

            foreach ($projects as $project) {
                // Get HTML for each project
                $project_response = wp_remote_get($options['api_url'] . '/api/license/project/' . $project['slug'], [
                    'headers' => [
                        'X-License-Key' => $license_key,
                        'X-Forwarded-Host' => $_SERVER['HTTP_HOST'] ?? ''
                    ],
                    'timeout' => 30,
                ]);

                if (is_wp_error($project_response))
                    continue;

                $project_data = json_decode(wp_remote_retrieve_body($project_response), true);

                if (!empty($project_data['html'])) {
                    $slug = sanitize_file_name($project['slug']);
                    $file = $sl_dir . '/' . $slug . '.html';
                    file_put_contents($file, $project_data['html']);
                    $count++;

                    // Store project info for later
                    $project_list[] = [
                        'slug' => $project['slug'],
                        'name' => $project['name'],
                        'structureType' => $project['structureType'],
                        'updatedAt' => $project['updatedAt']
                    ];
                }
            }

            // Cache project list
            set_transient($this->projects_transient, $project_list, DAY_IN_SECONDS);

            wp_send_json_success("$count landing pages sincronizadas");
        }

        wp_send_json_error('Tarea desconocida');
    }

    /**
     * Get pages AJAX (for potential frontend use)
     */
    public function ajax_get_pages()
    {
        if (!current_user_can('manage_options'))
            wp_send_json_error('Sin permisos');

        $projects = get_transient($this->projects_transient);

        if (empty($projects)) {
            wp_send_json_error('No hay páginas sincronizadas');
        }

        wp_send_json_success($projects);
    }

    /**
     * Daily sync (cron)
     */
    public function daily_sync()
    {
        $options = get_option($this->option_name, []);

        if (empty($options['api_url']) || empty($options['license_key'])) {
            return;
        }

        // Simulate sync - same as manual sync
        $_POST['task'] = 'sync';
        $this->ajax_sync();
    }

    /**
     * Intercept Slug — Serve static HTML
     */
    public function intercept_slug()
    {
        $options = get_option($this->option_name, []);
        $base = $options['base_slug'] ?? 'landing';

        $request_uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        if (strpos($request_uri, $base . '/') !== 0)
            return;

        $slug = sanitize_file_name(substr($request_uri, strlen($base) + 1));
        if (empty($slug))
            return;

        $upload_dir = wp_upload_dir();
        $file = $upload_dir['basedir'] . '/staticlaunch/' . $slug . '.html';

        if (file_exists($file)) {
            status_header(200);
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: public, max-age=3600');

            // Inject base URL for assets if needed
            $html = file_get_contents($file);

            // Add security headers
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');

            echo $html;
            exit;
        }
    }

    /**
     * Admin Styles
     */
    public function admin_styles($hook)
    {
        if (strpos($hook, 'staticlaunch') === false)
            return;
        echo '<style>
            .staticlaunch-wrap { max-width: 900px; }
            .staticlaunch-wrap h1 { font-size: 28px; margin-bottom: 20px; }
            .staticlaunch-wrap .button { margin-right: 10px; margin-bottom: 10px; }
            .staticlaunch-actions { margin: 15px 0; }
        </style>';
    }
}

new StaticLaunch_Connector();
