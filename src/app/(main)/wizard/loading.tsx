export default function WizardLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] animate-pulse">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 mx-auto" />
                <div className="h-5 w-40 rounded bg-white/10 mx-auto" />
                <div className="h-3 w-56 rounded bg-white/5 mx-auto" />
            </div>
        </div>
    )
}
