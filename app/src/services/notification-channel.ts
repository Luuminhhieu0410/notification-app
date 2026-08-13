export function buildDailyContentChannel(importance: number) {
  return {
    name: 'Nội dung hằng ngày',
    description: 'Thông báo nội dung mới mỗi sáng',
    importance,
  };
}
