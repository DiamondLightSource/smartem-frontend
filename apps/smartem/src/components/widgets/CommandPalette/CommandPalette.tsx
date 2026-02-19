import type React from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import './CommandPalette.css'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string[]
  keywords?: string[]
  onSelect: () => void
}

export interface CommandGroup {
  id: string
  label: string
  items: CommandItem[]
}

export interface CommandPaletteProps {
  groups: CommandGroup[]
  placeholder?: string
  isOpen?: boolean
  onClose?: () => void
  shortcutKey?: string
  requireMeta?: boolean
  maxHeight?: number
  emptyMessage?: string
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  groups,
  placeholder = 'Type a command or search...',
  isOpen: controlledIsOpen,
  onClose,
  shortcutKey = 'k',
  requireMeta = true,
  maxHeight = 400,
  emptyMessage = 'No results found.',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const isOpen = controlledIsOpen ?? internalIsOpen

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(open)
      }
      if (!open) {
        onClose?.()
        setQuery('')
        setSelectedIndex(0)
      }
    },
    [controlledIsOpen, onClose]
  )

  const fuzzyMatch = useCallback((text: string, search: string): number => {
    if (!search) return 1
    const searchLower = search.toLowerCase()
    const textLower = text.toLowerCase()

    if (textLower === searchLower) return 100
    if (textLower.startsWith(searchLower)) return 80
    if (textLower.includes(searchLower)) return 60

    let searchIdx = 0
    let score = 0
    for (let i = 0; i < textLower.length && searchIdx < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIdx]) {
        score += 10
        searchIdx++
      }
    }

    return searchIdx === searchLower.length ? score : 0
  }, [])

  const filteredItems = useMemo(() => {
    const items: Array<{ item: CommandItem; group: CommandGroup; score: number }> = []

    for (const group of groups) {
      for (const item of group.items) {
        const labelScore = fuzzyMatch(item.label, query)
        const descScore = item.description ? fuzzyMatch(item.description, query) * 0.5 : 0
        const keywordScore = item.keywords
          ? Math.max(...item.keywords.map((k) => fuzzyMatch(k, query))) * 0.7
          : 0

        const score = Math.max(labelScore, descScore, keywordScore)

        if (score > 0) {
          items.push({ item, group, score })
        }
      }
    }

    return items.sort((a, b) => b.score - a.score)
  }, [groups, query, fuzzyMatch])

  const groupedResults = useMemo(() => {
    const groupMap = new Map<string, { group: CommandGroup; items: CommandItem[] }>()

    for (const { item, group } of filteredItems) {
      if (!groupMap.has(group.id)) {
        groupMap.set(group.id, { group, items: [] })
      }
      groupMap.get(group.id)?.items.push(item)
    }

    return Array.from(groupMap.values())
  }, [filteredItems])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const metaPressed = e.metaKey || e.ctrlKey

      if (e.key.toLowerCase() === shortcutKey && (!requireMeta || metaPressed)) {
        // Skip if focused on a text input (unless meta is required, in which case it's intentional)
        if (!requireMeta) {
          const target = e.target as HTMLElement
          const tag = target.tagName
          if (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            target.isContentEditable
          ) {
            return
          }
        }

        e.preventDefault()
        setIsOpen(!isOpen)
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen, shortcutKey, requireMeta])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredItems.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].item.onSelect()
          setIsOpen(false)
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
        } else {
          setSelectedIndex((i) => (i + 1) % totalItems)
        }
        break
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - scroll when selection changes
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector('[data-selected="true"]')
    selectedElement?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  let itemIndex = -1

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close is standard modal UX
    <div
      className="command-palette-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
      role="presentation"
    >
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-palette__header">
          <svg
            className="command-palette__search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette__input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls={listId}
          />
          <kbd className="command-palette__shortcut">ESC</kbd>
        </div>

        <div
          ref={listRef}
          id={listId}
          className="command-palette__list"
          style={{ maxHeight }}
          role="listbox"
        >
          {groupedResults.length === 0 ? (
            <div className="command-palette__empty">{emptyMessage}</div>
          ) : (
            groupedResults.map(({ group, items }) => (
              <div key={group.id} className="command-palette__group">
                <div className="command-palette__group-label">{group.label}</div>
                {items.map((item) => {
                  itemIndex++
                  const isSelected = itemIndex === selectedIndex
                  const currentIndex = itemIndex

                  return (
                    <div
                      key={item.id}
                      className={`command-palette__item ${isSelected ? 'command-palette__item--selected' : ''}`}
                      data-selected={isSelected}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => {
                        item.onSelect()
                        setIsOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          item.onSelect()
                          setIsOpen(false)
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      {item.icon && <span className="command-palette__item-icon">{item.icon}</span>}
                      <div className="command-palette__item-content">
                        <span className="command-palette__item-label">{item.label}</span>
                        {item.description && (
                          <span className="command-palette__item-description">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {item.shortcut && (
                        <div className="command-palette__item-shortcut">
                          {item.shortcut.map((key) => (
                            <kbd key={key} className="command-palette__kbd">
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette__footer">
          <span className="command-palette__hint">
            <kbd className="command-palette__kbd">↑</kbd>
            <kbd className="command-palette__kbd">↓</kbd>
            to navigate
          </span>
          <span className="command-palette__hint">
            <kbd className="command-palette__kbd">↵</kbd>
            to select
          </span>
          <span className="command-palette__hint">
            <kbd className="command-palette__kbd">esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  )
}
