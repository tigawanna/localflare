import * as React from "react"
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { cn } from "@cloudflare/kumo"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  showShortcut?: boolean
  className?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  showShortcut = false,
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange("")
    onClear?.()
    inputRef.current?.focus()
  }

  React.useEffect(() => {
    if (!showShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showShortcut])

  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlassIcon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-strong pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 pl-9 pr-9 text-sm bg-kumo-base border border-kumo-line rounded-md",
          "placeholder:text-kumo-subtle",
          "focus:outline-none focus:ring-2 focus:ring-kumo-ring focus:border-transparent",
          "transition-colors"
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-strong hover:text-kumo-default transition-colors"
        >
          <XIcon size={16} />
        </button>
      ) : showShortcut ? (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-kumo-strong font-mono bg-kumo-fill px-1.5 py-0.5 rounded border border-kumo-line">
          {navigator.platform.includes("Mac") ? "⌘K" : "Ctrl+K"}
        </kbd>
      ) : null}
    </div>
  )
}
