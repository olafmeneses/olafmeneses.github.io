# Needed libraries

packages = c("knitr","tidyverse", "lubridate", "magrittr", "plotly", "tictoc",
             "stringdist", "stringi", "assertthat", "Rtsne", "DescTools", "igraph",
             "threejs", "DT", "visNetwork",  "parallelDist", "paletteer", "colorspace", "shiny", "shinyWidgets"
             )

# Install and load above packages

package.check <- lapply(packages, FUN = function(x) {
  if (!require(x, character.only = TRUE)) {
    install.packages(x, dependencies = TRUE)
    library(x, character.only = TRUE)
  }
})

lang_df <- read_csv("../data/lang_df.csv", show_col_types = F)
num_df <- read_csv("../data/num_df.csv", show_col_types = F)
source("../functions/clean_data.R", encoding = "UTF-8")
source("../functions/lang_dist_matrix.R", encoding = "UTF-8")
source("../functions/plotters.R", encoding = "UTF-8")
source("../functions/kNN.R", encoding = "UTF-8")
source("../functions/kNN_graph.R", encoding = "UTF-8")
source("../functions/graph_plotters.R", encoding = "UTF-8")

n_df <- num_df %>% 
  mutate(across(N1:N10, ~remove_non_alphabetic(.x))) %>% 
  filter(if_all(N1:N10, ~!is.na(.x))) %>% 
  filter(if_all(N1:N10, ~not_empty(.x))) %>%
  filter_lang("lang_name != 'written' & lang_name != 'numerals' & group1 != 'Constructed languages' & group1 != 'Almean' & group1 != 'Pidgins and Creoles'")

l_df <- lang_df %>% filter(lang_id %in% n_df$lang_id)
top_k_fam_groups <- l_df %>% count(group1) %>% slice_max(order_by = n, n = 5, with_ties = F) %>% pull(group1)
top_k_fam_groups <- c("all", top_k_fam_groups)
load("./others3.RData")
# d_mat <- lang_dist_matrix(n_df, "dl")
# mds <- cmdscale(d_mat, eig=TRUE, k=3)$points
# set.seed(666)
# tsne <- Rtsne(d_mat, dims = 3, is_distance = T, perplexity = 50, pca = F, max_iter = 5000)$Y
# g <- get_kNN_graph(d_mat, k=2)
# save(mds, tsne, g, file = "./others3.RData")

unique_strings <- unique(V(g)$group1)
num_unique <- length(unique_strings)

color_palette <- rainbow(num_unique)

# color_mapping_g1 <- setNames(color_palette, unique_strings)
pal <- paletteer_d("dichromat::GreentoMagenta_16")
color_mapping_g1 <- color_map(V(g)$group1, pal=pal)

embedding_opts <- c("MDS" = "mds", "tSNE" = "tsne")

group_opts <- paste0("group", 1:7)
names(group_opts) <- paste0("Group ", 1:7)

families_count <- l_df %>% count(group1) %>% arrange(desc(n))
families <- families_count %>% pull(group1)
counts <- families_count %>% pull(n)
filter_group_opts <- families
counts_subtext <- ifelse(counts > 1, paste(counts, "languages"), paste(counts, "language"))



