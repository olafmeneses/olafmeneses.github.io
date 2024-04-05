get_kNN_graph <- function(dist_mat, k){
  kNN_mat <- t(apply(as.matrix(dist_mat) - diag(1, nrow(dist_mat)), MARGIN=1, FUN=function(x, k){names(Small(x, k=k))}, k = k+1))
  df <- as.data.frame(kNN_mat) %>%
    pivot_longer(-V1, names_to = "name", values_to = "end") 
  
  graph_df <- df %>% select(-name)
  
  lang_ids <- names(dist_mat)
  nearest_nbor <- df %>% filter(name == "V2") %>% select(-name) %>% mutate(V1 = as.numeric(V1), end = as.numeric(end)) %>% rename(nbor_id = end)
  g <- graph_from_data_frame(graph_df, directed = F,
                             vertices = lang_df %>%
                               filter(lang_id %in% lang_ids) %>%
                               inner_join(nearest_nbor, by = c("lang_id" = "V1")) %>% 
                               inner_join(lang_df, by = c("nbor_id" = "lang_id"), suffix = c("", "_nbor")) %>% 
                               inner_join(n_df, by = "lang_id") %>% 
                               inner_join(n_df, by = c("nbor_id" = "lang_id"), suffix = c("", "_nbor")))
  V(g)$name <- V(g)$lang_name
  
  return(g)
}