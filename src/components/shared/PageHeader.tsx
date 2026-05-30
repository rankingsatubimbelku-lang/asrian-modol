import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  action?: { label: string; href: string; icon?: React.ReactNode }
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-gray-600 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-gray-600 font-medium">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && (
        <Link href={action.href}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            {action.icon}
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}
