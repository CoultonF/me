export const About = () => {
  return (
    <div className="flex flex-col mx-auto container px-4 py-5 max-w-3xl gap-10 bg-stripes-red">
      <blockquote>
        <p className="text-2xl">
          "A software developer in Calgary that <em>lives</em> on open-source
          software."
        </p>
      </blockquote>
      <p>
        Currently working on a diverse team that is utilizing React and FastAPI
        full-stack development to solve complex land problems in the Oil & Gas
        sector across North America.
      </p>
      <p>
        I am always eager to use the most promising technology available. This
        website was built to accelerate my own understanding of{" "}
        <a
          rel="noopener"
          href="https://astro.build/"
          target="_blank"
          className="text-slate-500 underline"
        >
          Astro.js
        </a>
        {", "}
        <a
          rel="noopener"
          href="https://react.dev/"
          target="_blank"
          className="text-slate-500 underline"
        >
          React
        </a>
        , and{" "}
        <a
          rel="noopener"
          href="https://tailwindcss.com/"
          target="_blank"
          className="text-slate-500 underline"
        >
          TailwindCSS
        </a>
        . It was also my learning environment for dialing in a{" "}
        <a
          rel="noopener"
          href="https://neovim.io/"
          target="_blank"
          className="text-slate-500 underline"
        >
          Neovim
        </a>{" "}
        workflow.
      </p>
      <p>
        In my spare time I love to cook healthy and nutritious meals, dive deep
        into tech side projects, or get active in the outdoors.
      </p>
      <p>
        I am a{" "}
        <a
          rel="noopener"
          href="https://diabetes.ca/about-diabetes/type-1"
          className="text-slate-500 underline"
          target="_blank"
        >
          type-one diabetic
        </a>
        . I think what people don't understand about type-one diabetes is how
        serious it is and how hard it can be. I have had to figure out how to
        balance the things that can impact diabetes. My schedule, my activity,
        my insulin, what I eat, when I eat, to control blood glucose levels.
      </p>
      <p>
        Tidepool's Loop application is an open-source do-it-yourself effort by a
        group of people who said "we are not waiting for something better". The
        goal was to connect medical devices into a single platform to take in
        information about all aspects of your life. It has changed the way
        diabetes is managed now and in the future.
      </p>
    </div>
  );
};
