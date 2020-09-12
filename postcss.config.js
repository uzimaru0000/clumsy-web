const tailwind = require('tailwindcss');

const plugins = [tailwind];

if (process.env.NODE_ENV !== 'development') {
  const purgecss = require('@fullhuman/postcss-purgecss');

  class TailwindExtractor {
    static extract(content) {
      return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
    }
  }

  plugins.push(
    purgecss({
      content: ['src/*.html', 'src/**/*.tsx'],
      extractors: [
        {
          extractor: TailwindExtractor,
          extensions: ['html', 'tsx'],
        },
      ],
    })
  );
}

module.exports = {
  plugins,
};
