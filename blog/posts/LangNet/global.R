# library(dplyr)
# library(tidyr)
# library(readr)
# library(stringr)
# # library(Rtsne)
# # library(stringdist)
# library(stringi)
# library(assertthat)
# library(DescTools)
library(igraph)
library(threejs)
# library(paletteer)
# library(colorspace)
library(shiny)
library(shinyWidgets)
library(shinyjs)
library(shinyBS)
library(shinyalert)
library(waiter)

source("./functions/plotters.R", encoding = "UTF-8")
source("./functions/graph_plotters.R", encoding = "UTF-8")
load("./data/data.RData")

# Generate data
# lang_df <- read_csv("./data/lang_df.csv", show_col_types = F)
# num_df <- read_csv("./data/num_df.csv", show_col_types = F)
# source("./functions/clean_data.R", encoding = "UTF-8")
# source("./functions/lang_dist_matrix.R", encoding = "UTF-8")
# source("./functions/kNN.R", encoding = "UTF-8")
# source("./functions/kNN_graph.R", encoding = "UTF-8")
# 
# n_df <- num_df %>% 
#   mutate(across(N1:N10, ~remove_non_alphabetic(.x))) %>% 
#   filter(if_all(N1:N10, ~!is.na(.x))) %>% 
#   filter(if_all(N1:N10, ~not_empty(.x))) %>%
#   filter_lang("lang_name != 'written' & lang_name != 'numerals' & group1 != 'Constructed languages' & group1 != 'Almean' & group1 != 'Pidgins and Creoles'")
# 
# l_df <- lang_df %>% filter(lang_id %in% n_df$lang_id)
# 
# # d_mat <- lang_dist_matrix(n_df, "dl")
# # mds <- cmdscale(d_mat, eig=TRUE, k=3)$points
# # set.seed(666)
# # tsne <- Rtsne(d_mat, dims = 3, is_distance = T, perplexity = 50, pca = F, max_iter = 5000)$Y
# # g <- get_kNN_graph(d_mat, k=2)
# 
# pal <- "rainbow"
# color_mapping_g1 <- color_map(V(g)$group1, pal)
# 
# embedding_opts <- c("MDS" = "mds", "tSNE" = "tsne")
# 
# group_opts <- paste0("group", 1:7)
# names(group_opts) <- c("Macrofamily", paste0("Subfamily ", 1:6))
# 
# families_count <- l_df %>% count(group1) %>% arrange(desc(n))
# families <- families_count %>% pull(group1)
# counts <- families_count %>% pull(n)
# filter_group_opts <- families
# counts_subtext <- ifelse(counts > 1, paste(counts, "languages"), paste(counts, "language"))
# 
# 
# V(g)$label <- sprintf("       <h2 style='text-align:left;margin-left: 20px;'>%s</h2>
#                               <h3 style='text-align:left;margin-left: 20px;'>
#                               <p style='font-size:0.96em'>group1<br></p>
#                               <p style='font-size:0.94em'>group2<br></p>
#                               <p style='font-size:0.92em'>group3<br></p>
#                               <p style='font-size:0.90em'>group4<br></p>
#                               <p style='font-size:0.88em'>group5<br></p>
#                               <p style='font-size:0.86em'>group6<br></p>
#                               <p style='font-size:0.84em'>group7<br></p>
#                               </h3>
#                               <div id='div_num_table'>
#                               <table id = 'num_table' style='border-collapse: collapse;'>
#                                   <tr>
#                                       <td></td>
#                                       <th style='text-align: center;'>Selected</th>
#                                       <th style='text-align: center;'>Nearest</th></tr>
#                                   <tr>
#                                       <th style='text-align: left;'>Name</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>Family</th>
#                                       <td>table_group</td>
#                                       <td>table_group_nbor</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N1</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N2</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N3</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N4</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N5</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N6</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N7</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N8</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N9</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                                   <tr>
#                                       <th style='text-align: left;'>N10</th>
#                                       <td>%s</td>
#                                       <td>%s</td>
#                                   </tr>
#                               </table>
#                               </div>",
#                           V(g)$lang_name,
#                           V(g)$lang_name, V(g)$lang_name_nbor,
#                           V(g)$N1, V(g)$N1_nbor,
#                           V(g)$N2, V(g)$N2_nbor,
#                           V(g)$N3, V(g)$N3_nbor,
#                           V(g)$N4, V(g)$N4_nbor,
#                           V(g)$N5, V(g)$N5_nbor,
#                           V(g)$N6, V(g)$N6_nbor,
#                           V(g)$N7, V(g)$N7_nbor,
#                           V(g)$N8, V(g)$N8_nbor,
#                           V(g)$N9, V(g)$N9_nbor,
#                           V(g)$N10, V(g)$N10_nbor
# )
# 
# V(g)$label <- str_replace_all(V(g)$label, "group\\d|table_group(_nbor)?", "%s")
# 
# table_labels <- lapply(
#   group_opts,
#   function(group){
#     sprintf(V(g)$label,
#             process_labels("group1", group),
#             process_labels("group2", group),
#             process_labels("group3", group),
#             process_labels("group4", group),
#             process_labels("group5", group),
#             process_labels("group6", group),
#             process_labels("group7", group),
#             vertex_attr(g, group),
#             replace(vertex_attr(g, paste0(group, "_nbor")),
#                     is.na(vertex_attr(g, paste0(group, "_nbor"))),
#                     "<span style='color: rgb(255 255 255 / 52%);'>Undefined</span>"))
#   }
# )
# 
# save(embedding_opts, group_opts, filter_group_opts, counts_subtext, pal, color_mapping_g1, mds, tsne, g, table_labels, file = "./data/data.RData")
