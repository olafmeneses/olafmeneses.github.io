# General purpose
color_map <- function(vec, pal, assign = F, sort_vec = F) {
  if(sort_vec){
    unique_strings <- unique(sort(vec))
  }
  else{
    unique_strings <- unique(vec)
  }
  num_unique <- length(unique_strings)
  
  if(pal == "rainbow"){
    color_palette <- rainbow(num_unique)
  }
  else{
    color_palette <- colorRampPalette(paletteer_d(pal))(num_unique)
  }
  
  color_mapping <- setNames(color_palette, unique_strings)
  
  if (assign){
    assigned_colors <- color_mapping[vec]
    return(assigned_colors)
  }
  else{
    return(color_mapping)
  }
  
}

plot_langs <- function(df, pal, d=2, sort_color_by=F){
  color_mapping <- color_map(df$group1, pal, assign = F, sort_vec = sort_color_by)
  
  if (d == 2){
    ggplot(df) +
      geom_point(aes(x = x, y = y, color = group1)) +
      scale_color_manual(values = color_mapping) +
      labs(color = "Family") +
      theme_bw()
  }
  else if (d == 3){
    plot_ly(data = df, x=~x, y=~y, z=~z, color=~group1, colors = color_mapping,
            text=~paste0("<b>", lang_name, "</b>"),
            hoverinfo = "text+name",
            type = "scatter3d", mode = "markers") %>% 
      layout(hoverlabel = list(font=list(size=18)))
  }
}

plot_dendrogram <- function(hc, pal, sort_color_by = F, ...){
  colors <- color_map(hc$color_by, pal, assign = T, sort_vec = sort_color_by)
  
  p <- fviz_dend(hc,
                 cex = 0.65,              
                 main = "Indo-European Cluster Dendrogram",
                 type = "phylogenic",
                 phylo_layout = "layout_as_tree",
                 repel = T, 
                 ...
                 ) + 
    theme(axis.text.x = element_blank(),
          axis.text.y = element_blank(),
          axis.ticks.x = element_blank(),
          axis.ticks.y = element_blank())
  
  ordered_colors <- colors[order(labels(hc))]
  
  b <- ggplot_build(p)
  b$data[[2]]$colour <- ordered_colors
  b$data[[3]]$colour <- ordered_colors
  p <- ggplot_gtable(b)
  plot(p)
}