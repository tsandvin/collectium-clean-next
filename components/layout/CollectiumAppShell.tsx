import { CollectiumSidebar } from "./CollectiumSidebar";
import { CollectiumTopbar } from "./CollectiumTopbar";

export function CollectiumAppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="ct-shell">
      <CollectiumSidebar />
      <div className="ct-workspace">
        <CollectiumTopbar />
        <main className="ct-main">
          <div className="ct-main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
