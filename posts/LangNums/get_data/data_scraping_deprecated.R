# To scrape data
library(rvest)
library(httr)
library(polite)

# To clean data
library(tidyverse)

url <- "https://en.wiktionary.org/wiki/Appendix:Cardinal_numbers_0_to_9"

url_bow <- polite::bow(url)
url_bow

cardinals_html <-
  polite::scrape(url_bow) %>%  # scrape web page
  rvest::html_nodes("table.wikitable") %>% # pull out specific table
  rvest::html_table(fill = TRUE)

cardinals_lang <- cardinals_html[[1]] %>% 
  select(X1:X11) %>% 
  rename("language" = X1, "N0" = X2, "N1" = X3, "N2" = X4, "N3" = X5, "N4" = X6,
         "N5" = X7, "N6" = X8, "N7" = X9, "N8" = X10, "N9" = X11) %>% 
  filter(!is.na(language) & language != "")

path <- "./data/cardinals_lang.csv"
write_csv(cardinals_lang, path)
