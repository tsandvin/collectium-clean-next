/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Folder Tabs UI 8.5
 *
 * Definering / formÃ¥l:
 * Arkivmappe-faner for Samler, Historie og Finans.
 *
 * BruksomrÃ¥de:
 * Brukes pÃ¥ sider som trenger segmentfaner.
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - Ingen. Ren lokal UI/segmentvisning.
 */

type CollectiumFolderTabsProps = {
  active?: "samler" | "historie" | "finans";
};

const tabs = [
  { key: "samler", label: "Samler", icon: "â—‡", note: "Samling" },
  { key: "historie", label: "Historie", icon: "â–¥", note: "Relasjon" },
  { key: "finans", label: "Finans", icon: "âŒ", note: "Marked" },
] as const;

export default function CollectiumFolderTabs({ active = "historie" }: CollectiumFolderTabsProps) {
  return (
    <div className="ct-folder-tabs" role="tablist" aria-label="Collectium segmenter">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            className={`ct-folder-tab ct-folder-tab-${tab.key} ${selected ? "is-active" : ""}`}
            aria-selected={selected}
            role="tab"
          >
            <span className="ct-folder-tab-icon">{tab.icon}</span>
            <span className="ct-folder-tab-text">{tab.label}</span>
            <span className="ct-folder-tab-note">{tab.note}</span>
          </button>
        );
      })}
    </div>
  );
}