n_df <- num_df_clean
l_df <- lang_df %>% filter(lang_id %in% n_df$lang_id)
top_k_fam_groups <- l_df %>% count(group1) %>% slice_max(order_by = n, n = 5, with_ties = F) %>% pull(group1)
top_k_fam_groups <- c("all", top_k_fam_groups)
top_k_fam_groups_formatted <- str_replace(top_k_fam_groups, "-", "_")
dist_matrix <- lang_dist_matrix(n_df, "dl")
g <- get_kNN_graph(dist_matrix, k=2)
mds <- cmdscale(dist_matrix, eig=TRUE, k=3)$points
set.seed(666)
tsne <- Rtsne(dist_matrix, dims = 3, is_distance = T, perplexity = 50, pca = F, max_iter = 5000)$Y
save(dist_matrix, g, mds, tsne, file="./others.RData")

g <- g-E(g)
V(g)$label <- V(g)$lang_name



embeddings <- list(mds = mds,
                   tsne = tsne)
groups <- paste0("group", 1:7)
plot_names <- c()

for(e in names(embeddings)){
  if (e == "mds"){
    embedding_layout <- embeddings$mds
  }
  else if (e == "tsne"){
    embedding_layout <- embeddings$tsne
  }
  
  for(i in 1:length(top_k_fam_groups)){
    fg <- top_k_fam_groups[i]
    fg_formatted <- top_k_fam_groups_formatted[i]
    for(group in groups){
      V(g)$group <- vertex_attr(g, group)
      if (fg != "all"){
        V(g)$group <- ifelse(V(g)$group1 == fg, V(g)$group, NA)
      }
      
      V(g)$color <- assign_colors(V(g)$group)
      
      plot_name <- paste(e, fg_formatted, group, sep = "_")
      assign(plot_name, plot_graph(g, dim=3, layout=embedding_layout))
      plot_names <- c(plot_names, plot_name)
    }
  }
}

save(list = plot_names, file = "./p.RData")