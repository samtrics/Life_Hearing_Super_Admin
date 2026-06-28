"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { useTransition, useState, useEffect } from 'react'

export function PatientSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, router, pathname, searchParams])

  return (
    <div className="relative w-full sm:w-[350px] group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        {isPending ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        )}
      </div>
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patient name or mobile..." 
        className="block w-full rounded-full border border-border/60 bg-white/60 dark:bg-black/40 backdrop-blur-md pl-10 pr-12 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 ease-in-out hover:bg-white/80 dark:hover:bg-black/60"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
        {query && !isPending && (
          <button 
            onClick={() => setQuery('')}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted/50"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
