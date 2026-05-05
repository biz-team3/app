export function getExploreItems() {
  return Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    imageUrl: `https://picsum.photos/400/${320 + ((index * 47) % 180)}?random=${index}`,
    likeCount: (index * 37) % 500,
    commentCount: (index * 13) % 100,
  }));
}

