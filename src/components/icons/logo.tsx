import type { SVGProps } from "react";

export function ArtifexLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <path fill="none" d="M0 0h256v256H0z" />
      <path
        fill="currentColor"
        d="m237.6 85.3-80-56a16 16 0 0 0-19.2 0l-80 56a16 16 0 0 0-8.4 14.7V156a16 16 0 0 0 8.4 14.7l80 56a15.9 15.9 0 0 0 19.2 0l80-56A16 16 0 0 0 240 156V100a16 16 0 0 0-8.4-14.7ZM128 141.3l-58.4-40.8L128 59.7l58.4 40.8ZM40 106.3l80 56v43.4l-80-56Zm16 10.1v23.2l56 39.2v-24.8Zm72 73.9V147l56-39.2v24.8l-56 39.2Zm72-17.5-80 56v-43.4l80-56Z"
      />
    </svg>
  );
}
