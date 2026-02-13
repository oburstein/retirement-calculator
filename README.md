# Retirement Calculator

A clean, interactive retirement savings calculator built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools — just open `index.html` in a browser.

## Features

- **Return rate range** — provide low and high expected annual returns to see best/worst case projections side by side
- **Inflation adjustment** — see what your future savings are worth in today's dollars
- **Monthly or yearly contributions** — toggle between contribution frequencies with accurate compounding
- **Year-by-year growth chart** — visual breakdown of contributions vs. investment growth over time
- **Comma-formatted inputs** — currency fields auto-format as you type (e.g. `1,000,000`)

## Project Structure

```
├── index.html    # Page structure and layout
├── styles.css    # All styling
├── app.js        # Calculator logic and chart rendering
└── README.md
```

## Usage

Open `index.html` in any modern browser. No server required.

Fill in your details:
1. Current age and retirement age
2. Current savings
3. Contribution amount (toggle yearly/monthly)
4. Expected annual return range (low and high)
5. Expected inflation rate (defaults to 3%)

Hit **Calculate** to see your projections.

## How It Works

- **Yearly compounding**: `total = (total + contribution) * (1 + rate)`
- **Monthly compounding**: applies `rate / 12` each month for more accurate modeling
- **Inflation adjustment**: divides future value by `(1 + inflation)^years` to express in today's purchasing power
