library(tidyverse)
library(GGally) # for ggcorr
library(patchwork) # for multiple ggplots in one img

cardinals_lang <- read_csv("./data/cardinals_lang.csv")

tidy_cardinals_lang <- cardinals_lang %>% 
  pivot_longer(cols = N0:N9, names_to = "number", values_to = "num_name") %>% 
  mutate(number = as.integer(str_replace(number, "N", "")))

tiny_example <- tidy_cardinals_lang %>% 
  filter(language %in% c("English", "Spanish", "Basque", "Catalan",
                         "Italian", "German"))


sorted_cardinals_lang <- tidy_cardinals_lang %>% 
  arrange(language, num_name) %>% 
  mutate(position = rep(0:9, length(unique(tidy_cardinals_lang$language))))

# Last becomes first!

sorted_cardinals_lang %>% 
  filter(number == 0, position == 9)

# How many coincidences between ordered position and the number itself?

sorted_cardinals_lang %>% 
  filter(number == position)

# Scatter plot of number and its ordered position

sorted_cardinals_lang %>%
  ggplot() +
  geom_col(aes(position, number), position = "dodge") + 
  facet_wrap(~language) +
  scale_x_continuous(breaks = 0:9) +
  scale_y_continuous(breaks = 0:9)

# Which is the language that gets the order position paired with the number?
# In other words, the one with bigger correlation between position and number

df <- sorted_cardinals_lang %>%
  group_by(language) %>%
  nest() %>%
  mutate(corr = map2(data, language, ~cor(.x$number, .x$position)))

df$corr <- unlist(df$corr)
df <- df %>% 
  filter(abs(corr) >= 0.5) %>% 
  mutate(plot = map2(data, language, 
                     ~ggcorr(.x, label = T, label_round = 2) + ggtitle(.y)))

df$plot %>%
  wrap_plots(ncol = 5)


# With just cardinals, barely 10 words, can we see which languages are more near than others?

# We could calculate the distance between two languages as the sum of the difference (in absolute value)
# of the position for each number.

english <- sorted_cardinals_lang %>% filter(language == "Russian")
spanish <- sorted_cardinals_lang %>% filter(language == "Polish")

english %>%
  inner_join(spanish, by = "number") %>% 
  group_by(language.x, language.y) %>% 
  summarise(distance = sum(abs(position.x - position.y)))

lang_dist_df <- data.frame()

nested_lang <- sorted_cardinals_lang %>%
  group_by(language) %>%
  nest()

 # To not print summarise message
options(dplyr.summarise.inform = FALSE)

for(i in 1:nrow(nested_lang)){
  lan1_df <- nested_lang[i, ] %>% unnest(cols = c(data))
  for(j in (i+1):nrow(nested_lang)){
    lan2_df <- nested_lang[j, ] %>% unnest(cols = c(data))
    dist_df <- inner_join(lan1_df, lan2_df, by = "number", suffix = c("_lan1", "_lan2")) %>% 
      group_by(language_lan1, language_lan2) %>% 
      summarise(distance = sum(abs(position_lan1 - position_lan2)))
    lang_dist_df <- bind_rows(lang_dist_df, dist_df)
  }
}

# save(lang_dist_df, file = "./data/lang_dist_df.RData")
# load("./data/lang_dist_df.RData")
esp <- lang_dist_df %>% 
  filter(language_lan1 == "Spanish" | language_lan2 == "Spanish")
esp <- esp %>% 
  mutate(max = max(esp$distance),
         min = min(esp$distance),
         similarity = ((distance-min)/(max - min)),
         similarity = similarity +0.1)

esp$angle <- runif(nrow(esp), min = 0, max = 360)

library(plotly)


fig <- plot_ly(
  esp,
  type = 'scatterpolar',
  mode = 'markers'
) 
fig <- fig %>%
  add_trace(
    r = ~similarity,
    theta = ~angle,
    name = ~str_c(language_lan1, " - ", language_lan2)
  ) 
fig

