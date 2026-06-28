import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 min-h-[60vh]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 shadow-lg shadow-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-bold tracking-tight text-primary">Loading Data...</h2>
        <p className="text-sm text-muted-foreground">Securely fetching your clinic's records</p>
      </div>
    </div>
  )
}
