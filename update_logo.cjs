const fs = require('fs');

const minimalSvg = fs.readFileSync('AM LOGO/MINIMAL LOGO.svg', 'utf8');
const startupSvg = fs.readFileSync('AM LOGO/START UP LOGO.svg', 'utf8');
const mainSvg = fs.readFileSync('AM LOGO/MAIN LOGO.svg', 'utf8');

// Helper to extract inner HTML of SVG
const extractInner = (svg) => {
  const start = svg.indexOf('>') + 1;
  const end = svg.lastIndexOf('</svg>');
  return svg.substring(start, end).trim();
}

// Helper to get viewBox
const getViewBox = (svg) => {
  const match = svg.match(/viewBox="([^"]+)"/);
  return match ? match[1] : "0 0 283 283";
}

const logoTsx = `import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="${getViewBox(minimalSvg)}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${extractInner(minimalSvg)}
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="${getViewBox(startupSvg)}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${extractInner(startupSvg)}
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-full"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="${getViewBox(mainSvg)}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${extractInner(mainSvg)}
    </svg>
  )
}
`;

fs.writeFileSync('packages/ui/src/components/logo.tsx', logoTsx);
console.log("Updated logo.tsx");
