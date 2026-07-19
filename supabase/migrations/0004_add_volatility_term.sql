insert into terms (key, title, explainer) values
  (
    'significant_move',
    'Why did this move so much?',
    $$A daily move this large (5%+) is unusual for most established companies. Big swings like this often follow earnings reports, major news, or a shift in what investors expect for the future — rarely just random noise. Worth checking what happened before reacting to it.$$
  )
on conflict (key) do nothing;
