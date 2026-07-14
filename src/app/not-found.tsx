export const runtime = 'edge';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 text-center">
      <h2 className="text-5xl font-headline font-black uppercase text-indigo-500 mb-2">404</h2>
      <h1 className="text-xl font-bold mb-2">Page Not Found</h1>
      <p className="text-slate-400 text-xs mb-6 max-w-xs leading-relaxed">
        The store page or dashboard section you are trying to reach does not exist or has been moved.
      </p>
      <Link href="/" className="rounded-xl h-10 px-5 font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-600/15">
        Return Home
      </Link>
    </div>
  );
}
