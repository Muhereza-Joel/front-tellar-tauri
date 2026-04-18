export const SkeletonBase = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
  />
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    <SkeletonBase className="h-4 w-32" />
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <SkeletonBase className="h-12 w-full rounded-xl mt-4" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="border-b border-slate-100 dark:border-slate-800">
    <td className="px-6 py-4">
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-32" />
        <SkeletonBase className="h-3 w-48" />
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-2">
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="h-3 w-24" />
      </div>
    </td>
    <td className="px-6 py-4">
      <SkeletonBase className="h-5 w-16 rounded-full" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end gap-2">
        <SkeletonBase className="h-8 w-8 rounded-lg" />
        <SkeletonBase className="h-8 w-8 rounded-lg" />
      </div>
    </td>
  </tr>
);
