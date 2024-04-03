lang_dist_matrix <- function(df, dist, normalize = T){
  n_lan <- length(df$lang_id)
  
  string_mat <- as.matrix(df %>% select(-lang_id))
  # rownames(string_mat) <- df$lang_id
  dist_mat <- diag(0, nrow = n_lan, ncol = n_lan)
  rows <- nrow(string_mat)
  cols <- ncol(string_mat)
  m_length <- matrix(str_length(string_mat), nrow=rows, ncol=cols)
  
  not_s1 <- t(string_mat)
  not_l1 <- t(m_length)
  for (i in 1:(n_lan-1)){
    s1 <- string_mat[i, ]
    not_s1 <- not_s1[ , -1]
    m_dist <- matrix(stringdist(s1, not_s1, method = dist), nrow = rows-i, ncol = cols, byrow = T)
    if(normalize){
      l1 <- m_length[i, ]
      not_l1 <- not_l1[ , -1]
      m_max_length <- matrix(pmax(l1, not_l1), nrow=rows-i, ncol=cols, byrow=T)
      m_dist_sum <- rowSums(m_dist / m_max_length)
    }
    else{
      m_dist_sum <- rowSums(m_dist)
    }
    dist_mat[(i+1):rows, i] <- m_dist_sum
  }
  
  colnames(dist_mat) <- df$lang_id
  rownames(dist_mat) <- df$lang_id
  dist_mat <- as.dist(dist_mat)
  
  return(dist_mat)
}
library(parallelDist)
lang_pos_dist_matrix <- function(df, dist){
  num_pos_df <- df %>%
    pivot_longer(cols = N1:N10, names_to = "number", values_to = "num_name") %>% 
    mutate(number = as.integer(str_replace(number, "N", ""))) %>% 
    arrange(lang_id, num_name) %>% 
    mutate(position = rep(1:10, nrow(df))) %>% 
    select(-num_name) %>% 
    pivot_wider(names_from = position, values_from = number)
  
  n_lan <- length(num_pos_df$lang_id)
  
  mat <- as.matrix(num_pos_df %>% select(-lang_id))
  dist_mat <- as.matrix(parallelDist(mat, method = dist, threads = 5))
  
  colnames(dist_mat) <- num_pos_df$lang_id
  rownames(dist_mat) <- num_pos_df$lang_id
  dist_mat <- as.dist(dist_mat)
  
  return(dist_mat)
}