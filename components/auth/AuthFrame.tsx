import Link from "next/link";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link href="/feed" className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-danger font-black">JP</div>
          <div>
            <p className="text-xl font-black">Jean Prevost</p>
            <p className="text-xs text-zinc-500">social lyceen</p>
          </div>
        </Link>

        <section className="rounded-md border border-line bg-panel p-5 shadow-glow">
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </section>
        <div className="mt-4 text-center text-sm text-zinc-400">{footer}</div>
      </div>
    </main>
  );
}
