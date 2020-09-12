const tailwind = require('tailwindcss');

const plugins = [tailwind];

if (process.env.NODE_ENV !== 'development') {
  const purgecss = require('@fullhuman/postcss-purgecss');

  plugins.push(
    purgecss({
      content: ['src/*.html', 'src/**/*.tsx'],
      defaultExtractor: (content) => {
        // Capture as liberally as possible, including things like `h-(screen-1.5)`
        const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

        // Capture classes within other delimiters like .block(class="w-1/2") in Pug
        const innerMatches =
          content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];

        return broadMatches.concat(innerMatches);
      },
    })
  );
}

module.exports = {
  plugins,
};
