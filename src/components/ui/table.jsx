export function Table({ className = '', ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className = '', ...props }) {
  return (
    <thead className={className} {...props} />
  );
}

export function TableBody({ className = '', ...props }) {
  return (
    <tbody className={className} {...props} />
  );
}

export function TableRow({ className = '', ...props }) {
  return (
    <tr
      className={`border-b border-gray-200 transition-colors hover:bg-gray-100/50 ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = '', ...props }) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }) {
  return (
    <td
      className={`p-4 align-middle ${className}`}
      {...props}
    />
  );
}