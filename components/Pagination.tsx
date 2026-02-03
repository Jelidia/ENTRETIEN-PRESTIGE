"use client";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number; // 5-10 items per spec
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // No pagination needed
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="button-secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        style={{ opacity: hasPrevious ? 1 : 0.5 }}
        aria-label="Page precedente"
      >
        ← Previous
      </button>

      <div className="pagination-info" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}
      </div>

      <button
        type="button"
        className="button-secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        style={{ opacity: hasNext ? 1 : 0.5 }}
        aria-label="Page suivante"
      >
        Next →
      </button>
    </nav>
  );
}
