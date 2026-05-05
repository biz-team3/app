import { getExploreItems } from "./explore.mock.js";

export function ExplorePage() {
  const items = getExploreItems();
  return (
    <div className="columns-2 gap-1 px-1 py-2 md:columns-3 md:gap-6">
      {items.map((item) => (
        <div key={item.id} className="group relative mb-1 break-inside-avoid overflow-hidden md:mb-6">
          <img src={item.imageUrl} alt="" className="h-auto w-full object-cover transition group-hover:brightness-75" />
        </div>
      ))}
    </div>
  );
}

