export function PanelHeader({ title, help }: { title: string; help: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-[30px] font-medium leading-tight">{title}</h2>
      <p className="text-sm text-muted">{help}</p>
    </div>
  );
}
