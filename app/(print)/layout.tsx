/**
 * Layout for the print/export document. Deliberately outside the (app) shell:
 * no sidebar, no command palette, no dashboard chrome. Just the document, on a
 * neutral backdrop on screen and edge to edge when printed.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="report-screen min-h-svh bg-neutral-200">{children}</div>;
}
