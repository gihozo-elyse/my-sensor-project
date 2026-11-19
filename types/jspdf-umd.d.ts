// The UMD build is imported to avoid bundler issues; reuse jsPDF's own type definitions.
declare module "jspdf/dist/jspdf.umd.min.js" {
  export { jsPDF } from "jspdf";
}
