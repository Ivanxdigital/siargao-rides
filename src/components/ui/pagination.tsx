import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= half) {
      end = Math.min(totalPages, maxVisiblePages);
    } else if (currentPage > totalPages - half) {
      start = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }
    
    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 bg-card/50 border-border/50 text-white hover:bg-card disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* First page button (mobile only) */}
      {showFirstLast && currentPage > 3 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          className="sm:hidden bg-card/50 border-border/50 text-white hover:bg-card"
        >
          1
        </Button>
      )}

      {/* Page numbers */}
      <div className="hidden sm:flex items-center space-x-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <div className="flex items-center justify-center w-8 h-8">
                <MoreHorizontal size={16} className="text-gray-400" />
              </div>
            ) : (
              <Button
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={
                  page === currentPage
                    ? "bg-primary text-primary-foreground min-w-[32px]"
                    : "bg-card/50 border-border/50 text-white hover:bg-card min-w-[32px]"
                }
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current page indicator (mobile only) */}
      <div className="sm:hidden flex items-center">
        <span className="text-sm text-white/80">
          {currentPage} of {totalPages}
        </span>
      </div>

      {/* Last page button (mobile only) */}
      {showFirstLast && currentPage < totalPages - 2 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="sm:hidden bg-card/50 border-border/50 text-white hover:bg-card"
        >
          {totalPages}
        </Button>
      )}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 bg-card/50 border-border/50 text-white hover:bg-card disabled:opacity-50"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}

export default Pagination;