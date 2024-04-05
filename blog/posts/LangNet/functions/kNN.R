get_kNN <- function(dist_mat, k){
  
  kNN_df <- as.data.frame(t(apply(as.matrix(dist_mat) - diag(1, nrow(dist_mat)), MARGIN=1, FUN=function(x, k){names(Small(x, k=k))}, k = k+1))) %>%
    rownames_to_column("V0") %>%
    pivot_longer(cols=-V0, names_to = "NN", values_to = "NN_id")
  kNN_dist <-  as.data.frame(t(apply(dist_mat, MARGIN=1, FUN=Small, k = k+1))) %>%
    rownames_to_column("V0") %>%
    pivot_longer(cols=-V0, names_to = "NN", values_to = "NN_dist") %>% 
    pull(NN_dist)
  
  kNN_df$dist <- kNN_dist
     
  kNN_info_df <- kNN_df %>% 
    mutate(V0 = as.numeric(V0),
           NN_id = as.numeric(NN_id)) %>% 
    left_join(lang_df, by = c("NN_id" = "lang_id")) %>% 
    left_join(num_df, by = c("NN_id" = "lang_id"))
  
  groups <- paste0("group", 1:7)
  summary <- data.frame(V0 = unique(kNN_info_df$V0))
  for(g in groups){
    g_target <- kNN_info_df %>%
      filter(NN == "V1", !is.na(eval(parse(text = g)))) %>%
      select(V0, !!quo_name(g))
    
    g_pred <- kNN_info_df %>%
      filter(NN != "V1", !is.na(eval(parse(text = g)))) %>%
      group_by(V0, g = eval(parse(text = g))) %>%
      summarise(mean_dist = mean(dist)) %>%
      ungroup() %>% 
      group_by(V0) %>% 
      slice_min(order_by = mean_dist, with_ties = F) %>% 
      ungroup() %>% 
      rename(!!quo_name(g) := g, !!quo_name(paste0("dist_", g)):= mean_dist) %>% 
      left_join(g_target, by = "V0", suffix = c("_pred", "_target"))
    
    summary <- left_join(summary, g_pred, by = "V0")
  }
  
  return(list(kNN_info_df = kNN_info_df, summary = summary))
}

get_kNN_accuracy <- function(g, summary){
  res <- summary %>%
    select(starts_with(g)) %>%
    filter_at(.vars = vars(ends_with("target")), ~!is.na(.x))
  pred <- res[, 1]
  target <- res[, 2]
  acc <- mean(pred == target)
  return(acc)
}

get_kNN_correct <- function(res, g){
  pred_var_name <- paste0(g, "_pred")
  target_var_name <- paste0(g, "_target")
  correct_ids <- res$summary %>%
    select(V0, starts_with(g)) %>%
    filter_at(.vars = vars(ends_with("target")), ~!is.na(.x)) %>% 
    filter(eval(parse(text = pred_var_name)) == eval(parse(text = target_var_name))) %>% 
    pull(V0)
  
  correct_kNN_info_df <- res$kNN_info_df %>% filter(V0 %in% correct_ids) %>% select(V0, NN_id, dist, lang_name, starts_with(g), N1:N10)
  return(correct_kNN_info_df)
}



### TODO Modificar para que se vea cuál es la clase predicha
get_kNN_incorrect <- function(summary, g){
  pred_var_name <- paste0(g, "_pred")
  target_var_name <- paste0(g, "_target")
  incorrect_ids <- res$summary %>%
    select(V0, starts_with(g)) %>%
    filter_at(.vars = vars(ends_with("target")), ~!is.na(.x)) %>% 
    filter(eval(parse(text = pred_var_name)) != eval(parse(text = target_var_name))) %>% 
    pull(V0)
  
  incorrect_kNN_info_df <- res$kNN_info_df %>% filter(V0 %in% incorrect_ids) %>% select(V0, NN_id, dist, lang_name, starts_with(g), N1:N10)
  return(incorrect_kNN_info_df)
}


### TODO Modificar para que se vea cuál es la clase predicha
get_kNN_unknown <- function(summary, g){
  pred_var_name <- paste0(g, "_pred")
  target_var_name <- paste0(g, "_target")
  unknown_ids <- res$summary %>%
    select(V0, starts_with(g)) %>%
    filter_at(.vars = vars(ends_with("target")), ~is.na(.x)) %>% 
    pull(V0)
  
  unknown_kNN_info_df <- res$kNN_info_df %>% filter(V0 %in% unknown_ids) %>% select(V0, NN_id, dist, lang_name, starts_with(g), N1:N10)
  return(unknown_kNN_info_df)
}


#####  DEPRECATED

# #### We create an auxiliar hash to speed up things
# group_mat <- as.matrix(lang_df %>% select(starts_with("group")))
# rownames(group_mat) <- lang_df$lang_id
# 
# # Create hash to assign groups given an id
# id_to_group <- hash()
# for (lang_id in rownames(group_mat)){
#   id_to_group[[lang_id]] <- group_mat[lang_id, ]
# }
# 
# get_kNN_optim <- function(dist_mat, k){
#   kNN_mat <- t(apply(dist_mat, MARGIN=1, FUN=function(x, k){names(Small(x, k=k))}, k = k+1)) 
#   kNN_dist_mat <- t(apply(dist_mat, MARGIN=1, FUN=Small, k = k+1))
#   kNN_group_mat <- apply(kNN_mat, MARGIN=c(1,2), FUN=function(x){id_to_group[[x]]})
#   
#   result <- list()
#   acc <- c()
#   for(g in 1:7){
#     group <- paste0("group", g)
#     
#     target <- data.frame(target_group = kNN_group_mat[g, , 1]) %>% filter(!is.na(target_group)) %>% rownames_to_column("lang_id")
#     target_lang_ids <- target$lang_id
#     predictors <- cbind(kNN_group_mat[g, target_lang_ids, -1], kNN_dist_mat[target_lang_ids, -1])
#     
#     df <- data.frame(predictors) %>% rownames_to_column("lang_id")
#     for(i in 1:k){
#       df[, i+1] <- paste(df[, i+1], df[, i+1+k], sep = "!")
#     }
#     df <- df %>% 
#       select(0:k+1) %>% 
#       pivot_longer(-lang_id, names_to = "number", values_to = "group") %>% 
#       separate(group, into=c("group", "dist"), sep = "!", convert = T) %>% 
#       select(-number) %>% 
#       filter(!is.na(group))
#     
#     pred_df <- df %>% 
#       group_by(lang_id, pred_group = group) %>%
#       summarise(mean_dist = mean(dist)) %>% 
#       ungroup() %>% 
#       group_by(lang_id) %>% 
#       slice_min(order_by = mean_dist, with_ties = F) %>% 
#       ungroup() %>% 
#       select(-mean_dist)
#     
#     result_df <- pred_df %>% 
#       inner_join(target, by = "lang_id")
#     
#     group_acc <- mean(result_df$pred_group == result_df$target_group)
#     
#     result[[group]] <- result_df
#     acc <- c(acc, group_acc)
#   }
#   result$acc <- acc
#   return(result)
# }