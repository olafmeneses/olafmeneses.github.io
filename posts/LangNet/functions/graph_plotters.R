plot_graph <- function(g, dim, layout = NA, ...){
  if(dim == 2){
    visIgraph(g, idToLabel = F, layout = "layout.norm", layoutMatrix = layout[, 1:2]) %>%
      visOptions(highlightNearest = T,
                 selectedBy = list("variable" = "group",
                                   "main" = "Select by family"
                                   ),
                 nodesIdSelection = list("enabled" = T,
                                         "main" = "Select by language",
                                         "values" = sort(V(g)$name)
                                         )
                 ) %>%
      visInteraction(dragNodes = F)
  }
  else if (dim == 3){
    graphjs(g, vertex.size = 0.2, bg = "black", layout = layout,...)
  }
}


process_labels <- function(group, selected_group){
  n <- as.integer(str_extract(group, "\\d"))
  g_labels <- vertex_attr(g, group)
  padding <- ""
  if (group == selected_group){
    g_labels <- str_c("➜ ", g_labels)
    if (n > 2){
      padding <- str_flatten(rep("&nbsp;", n-2))
    }
    g_labels <- str_c("<b>", g_labels, "</b>")
  }
  else{
    if (n > 2){
      padding <- str_flatten(rep("&nbsp;", n-2))
    }
    if (n > 1){
      padding <- str_c(padding, "|", "&nbsp;")
    }
  }
  
  g_labels <- str_c(padding, g_labels)
  g_labels <- BlankIfNA(g_labels)
  return(g_labels)
}