const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const mockData = {
    project: { name: 'Test Spacing Project' },
    meta: { seo_title: 'Test Spacing', favicon: '' },
    brand: {
        typography: {
            headings: { family: 'Rajdhani' },
            body: { family: 'Montserrat' }
        },
        border_radius: '8px',
        logoPath: 'https://via.placeholder.com/240x80'
    },
    pageColors: {
        bg: '#0A0E1A',
        bgAlt: '#111827',
        text: '#F3F4F6',
        textMuted: '#9CA3AF',
        primary: '#00F0FF',
        secondary: '#FF007F',
        accent: '#9333EA',
        border: '#374151'
    },
    sections: [
        { id: 'hero', type: 'hero', isVisible: true, eyebrow: 'Testing', title: 'Hero Section', subtitle: 'Testing spacing system rhythm.' },
        { id: 'benefits', type: 'benefits', isVisible: true, title: 'Our Benefits', items: ['Benefit 1', 'Benefit 2'] },
        { id: 'urgency', type: 'urgency', isVisible: true, text: 'Limited time offer!' },
        { id: 'faq', type: 'faq', isVisible: true, title: 'Questions', items: [{ q: 'How does it work?', a: 'Perfectly.' }] }
    ]
};

const templates = ['vsl.ejs', 'webinar.ejs', 'long_letter.ejs'];
const templatesDir = path.join(__dirname, 'templates');

templates.forEach(templateFile => {
    const templatePath = path.join(templatesDir, templateFile);
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    try {
        const html = ejs.render(templateContent, mockData, {
            filename: templatePath,
            root: templatesDir
        });
        console.log(`✅ ${templateFile} rendered successfully.`);
        // Basic check for spacing variables
        if (html.includes('--space-4xl')) {
            console.log(`   - Spacing tokens found.`);
        } else {
            console.log(`   - ❌ Spacing tokens MISSING.`);
        }
    } catch (err) {
        console.error(`❌ Error rendering ${templateFile}:`, err.message);
    }
});
