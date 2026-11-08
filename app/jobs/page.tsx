import SectionPage from "@/components/section-page";

const jobs = [
  { title: "Frontend dasturchi", meta: "Toshkent · 2 kun oldin", price: "15 000 000 so‘m" },
  { title: "Marketing menejeri", meta: "Toshkent · 3 kun oldin", price: "12 000 000 so‘m" },
  { title: "Sotuv menejeri", meta: "Samarqand · 1 kun oldin", price: "10 000 000 so‘m" },
  { title: "Backend dasturchi (Node.js)", meta: "Toshkent · 4 kun oldin", price: "18 000 000 so‘m" },
  { title: "UI/UX dizayner", meta: "Toshkent · 5 kun oldin", price: "11 000 000 so‘m" },
  { title: "SMM mutaxassisi", meta: "Buxoro · 2 kun oldin", price: "8 000 000 so‘m" },
];

export default function JobsPage() {
  return <SectionPage type="jobs" items={jobs} />;
}
