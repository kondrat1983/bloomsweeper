// Chapters and pages shown in the app (M1: Garden).
export const CHAPTERS = [
  {
    id: 'garden',
    title: 'Garden',
    pages: [
      { id: 'garden/01-rabbit', title: 'The rabbit', size: 'Lesson' },
      { id: 'garden/02-fox', title: 'The fox', size: 'Lesson' },
      { id: 'garden/03-small', title: 'Page 3', size: 'Small' },
      { id: 'garden/04-medium', title: 'Page 4', size: 'Medium' },
      { id: 'garden/05-large', title: 'Page 5', size: 'Large' },
    ],
  },
];
export const ALL_PAGES = CHAPTERS.flatMap((c) => c.pages);
export const pageInfo = (id) => ALL_PAGES.find((p) => p.id === id) || { id, title: id.split('/').pop(), size: '' };
