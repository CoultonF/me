import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { useAuth } from '../shared/useAuth';
import type { Gift, GiftsAPIResponse } from '../../lib/types/gifts';

const queryClient = new QueryClient();

const columnHelper = createColumnHelper<Gift>();

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-dim">-</span>;
  return (
    <span className="text-amber-400">
      {'★'.repeat(rating)}
      <span className="text-dim">{'☆'.repeat(5 - rating)}</span>
    </span>
  );
}

function WishlistTable() {
  const isAdmin = useAuth();
  const code = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('code');
  }, []);

  const { data, isLoading, error } = useQuery<GiftsAPIResponse>({
    queryKey: ['wishlist', code, isAdmin],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (code && !isAdmin) params.set('code', code);
      const res = await fetch(`/api/wishlist?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<GiftsAPIResponse>;
    },
    // Re-fetch when admin status changes (starts false, may become true)
    enabled: isAdmin || !!code,
    retry: false,
  });

  const [sorting, setSorting] = useState<SortingState>([{ id: 'rating', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Gift',
      cell: (info) => {
        const gift = info.row.original;
        return gift.url
          ? <a href={gift.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{info.getValue()}</a>
          : <span>{info.getValue()}</span>;
      },
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: (info) => {
        const v = info.getValue();
        return v != null ? `$${v.toFixed(2)}` : '-';
      },
    }),
    columnHelper.accessor('store', {
      header: 'Store',
      cell: (info) => info.getValue() ?? '-',
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: (info) => <Stars rating={info.getValue()} />,
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => (
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('notes', {
      header: 'Notes',
      cell: (info) => info.getValue() ?? '-',
      enableSorting: false,
    }),
    ...(data?.isAdmin ? [
      columnHelper.accessor('purchased', {
        header: 'Status',
        cell: (info: { getValue: () => boolean }) => (
          info.getValue()
            ? <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">purchased</span>
            : <span className="text-xs text-dim">available</span>
        ),
      }),
    ] : []),
  ], [data?.isAdmin]);

  const table = useReactTable({
    data: data?.gifts ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Not admin and no code
  if (!isAdmin && !code) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <p className="text-body font-medium mb-2">Access Required</p>
        <p className="text-dim text-sm">You need an access link to view this wishlist.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-dim text-sm">Loading wishlist...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-500 rounded-md px-4 py-3 text-sm">
        {error instanceof Error ? error.message : 'Failed to load wishlist'}
      </div>
    );
  }

  if (!data || data.gifts.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <p className="text-dim text-sm">No gifts on the wishlist yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-heading">Wishlist</h2>
        <input
          type="text"
          placeholder="Search gifts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-page border border-stroke rounded-md px-3 py-1.5 text-sm text-body focus:outline-none focus:border-accent w-48 md:w-64"
        />
      </div>

      {data.categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {data.categories.map((c) => (
            <span key={c} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500">{c}</span>
          ))}
          {data.isAdmin && <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-500">admin view</span>}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-stroke">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-stroke bg-tile">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-medium text-dim uppercase tracking-wide cursor-pointer select-none hover:text-body"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-stroke last:border-0 hover:bg-tile/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 text-body">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-dim">
        {table.getFilteredRowModel().rows.length} gift{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function GiftWishlist() {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistTable />
    </QueryClientProvider>
  );
}
