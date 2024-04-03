get_kNN_graph <- function(dist_mat, k){
  kNN_mat <- t(apply(dist_mat, MARGIN=1, FUN=function(x, k){names(Small(x, k=k))}, k = k+1))
  df <- as.data.frame(kNN_mat) %>%
    pivot_longer(-V1, names_to = "name", values_to = "end") %>% 
    select(-name)
  
  lang_ids <- names(dist_mat)
  g <- graph_from_data_frame(df, directed = F, vertices = lang_df %>% filter(lang_id %in% lang_ids))
  V(g)$name <- V(g)$lang_name
  
  return(g)
}