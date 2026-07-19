-- Starter ticker universe and education content. This is a seed, not the
-- final list — edit freely as the product's coverage is refined. Kept
-- deliberately smaller than the ~40-60 target so it's easy to review.

insert into tickers (symbol, name, market, sector) values
  ('AAPL', 'Apple Inc.', 'US', 'Technology'),
  ('MSFT', 'Microsoft Corporation', 'US', 'Technology'),
  ('GOOGL', 'Alphabet Inc.', 'US', 'Technology'),
  ('AMZN', 'Amazon.com, Inc.', 'US', 'Consumer Discretionary'),
  ('META', 'Meta Platforms, Inc.', 'US', 'Technology'),
  ('NVDA', 'NVIDIA Corporation', 'US', 'Technology'),
  ('TSLA', 'Tesla, Inc.', 'US', 'Consumer Discretionary'),
  ('NFLX', 'Netflix, Inc.', 'US', 'Communication Services'),
  ('AMD', 'Advanced Micro Devices, Inc.', 'US', 'Technology'),
  ('INTC', 'Intel Corporation', 'US', 'Technology'),
  ('CRM', 'Salesforce, Inc.', 'US', 'Technology'),
  ('ORCL', 'Oracle Corporation', 'US', 'Technology'),
  ('ADBE', 'Adobe Inc.', 'US', 'Technology'),
  ('HBL', 'Habib Bank Limited', 'PSX', 'Banking'),
  ('UBL', 'United Bank Limited', 'PSX', 'Banking'),
  ('MCB', 'MCB Bank Limited', 'PSX', 'Banking'),
  ('NBP', 'National Bank of Pakistan', 'PSX', 'Banking'),
  ('MEBL', 'Meezan Bank Limited', 'PSX', 'Banking'),
  ('BAHL', 'Bank Al Habib Limited', 'PSX', 'Banking'),
  ('LUCK', 'Lucky Cement Limited', 'PSX', 'Cement'),
  ('DGKC', 'D.G. Khan Cement Company Limited', 'PSX', 'Cement'),
  ('MLCF', 'Maple Leaf Cement Factory Limited', 'PSX', 'Cement'),
  ('FCCL', 'Fauji Cement Company Limited', 'PSX', 'Cement'),
  ('OGDC', 'Oil & Gas Development Company Limited', 'PSX', 'Energy'),
  ('PPL', 'Pakistan Petroleum Limited', 'PSX', 'Energy'),
  ('PSO', 'Pakistan State Oil Company Limited', 'PSX', 'Energy'),
  ('HUBC', 'Hub Power Company Limited', 'PSX', 'Energy'),
  ('SYS', 'Systems Limited', 'PSX', 'Technology'),
  ('TRG', 'TRG Pakistan Limited', 'PSX', 'Technology'),
  ('NETSOL', 'NetSol Technologies Limited', 'PSX', 'Technology')
on conflict (symbol) do nothing;

insert into terms (key, title, explainer) values
  (
    'pe_ratio',
    'P/E Ratio',
    $$Price-to-earnings ratio: the stock price divided by earnings per share. A rough measure of how much investors are paying for each dollar of profit the company makes. A higher P/E often means the market expects faster future growth.$$
  ),
  (
    'market_cap',
    'Market Cap',
    $$Market capitalization: the total value of a company's shares, calculated as share price multiplied by shares outstanding. It's a quick way to compare company size, not necessarily how "good" the business is.$$
  ),
  (
    'dividend_yield',
    'Dividend Yield',
    $$The annual dividend payment as a percentage of the current share price. Shows how much cash return you get from owning the stock, separate from any change in the share price itself.$$
  ),
  (
    '52_week_range',
    '52-Week Range',
    $$The lowest and highest price the stock has traded at over the past year. Useful for seeing where today's price sits relative to its recent history.$$
  ),
  (
    'volume',
    'Volume',
    $$The number of shares traded in a given period. High volume alongside a price move suggests stronger conviction behind that move than the same move on low volume.$$
  ),
  (
    'eps',
    'EPS',
    $$Earnings per share: a company's profit divided by its number of outstanding shares. It's the "earnings" half of the P/E ratio.$$
  )
on conflict (key) do nothing;
