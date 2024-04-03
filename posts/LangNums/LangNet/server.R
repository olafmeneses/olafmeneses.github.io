library(shiny)

function(input, output, session) {
  
  dist_matrix <- reactive({
    lang_dist_matrix(n_df, "dl")
  })
  
  embedding_ls <- reactiveValues(historic = NULL)
  
  observeEvent(
    {
      input$edges
      input$embedding
      input$color_by_group
      input$filter_group
    }, 
    {
      embedding_ls$historic <- c(embedding_ls$historic, input$embedding)
      prev_idx <- ifelse(length(embedding_ls$historic) == 1, 1, length(embedding_ls$historic) - 1)
      embedding_ls$current_embedding <- embedding_ls$historic[length(embedding_ls$historic)]
      embedding_ls$prev_embedding <- embedding_ls$historic[prev_idx]
    }
  )
  
  color_graph <- reactive({
    g_mod <- g
    if (!(input$edges)){
      g_mod <- g_mod-E(g_mod)
    }
    
    V(g_mod)$label <- sprintf("
                              <h2 style='text-align:left;margin-left: 20px;'>%s</h2>
                              <h3 style='text-align:left;margin-left: 20px;'>
                              <p style='font-size:0.96em'>%s<br></p>
                              <p style='font-size:0.94em'>%s<br></p>
                              <p style='font-size:0.92em'>%s<br></p>
                              <p style='font-size:0.90em'>%s<br></p>
                              <p style='font-size:0.88em'>%s<br></p>
                              <p style='font-size:0.86em'>%s<br></p>
                              <p style='font-size:0.84em'>%s</p>
                              </h3>",
                              V(g_mod)$lang_name,
                              process_labels("group1", input$color_by_group),
                              process_labels("group2", input$color_by_group),
                              process_labels("group3", input$color_by_group),
                              process_labels("group4", input$color_by_group),
                              process_labels("group5", input$color_by_group),
                              process_labels("group6", input$color_by_group),
                              process_labels("group7", input$color_by_group))
    
    g_selected <- get.vertex.attribute(g_mod, input$color_by_group)
    V(g_mod)$group <- g_selected
    V(g_mod)$group <- ifelse(V(g_mod)$group1 %in% input$filter_group, V(g_mod)$group, NA)
    if(input$color_by_group == "group1"){
      V(g_mod)$color <- color_mapping_g1[V(g_mod)$group]
    }
    else{
      V(g_mod)$color <- color_map(V(g_mod)$group, pal=pal, assign = T)
    }
    
    return(g_mod)
  })
  
  output$distPlot <- renderScatterplotThree({
    
    if(req(embedding_ls$current_embedding) == req(embedding_ls$prev_embedding)){
      p <- plot_graph(color_graph(), dim=3, layout=eval(parse(text = embedding_ls$current_embedding)), 
                 main = HTML("<h2 style='text-align:left; margin-left: 20px; font-size: 28px; color: rgb(255 255 255 / 62%);'>Hover for language & family info</h2>"))
    }
    else{
      if(embedding_ls$prev_embedding == "tsne" & embedding_ls$current_embedding == "mds"){
        p <- plot_graph(color_graph(), dim=3, layout=list(tsne, mds), fpl=400, 
                   main = HTML("<h2 style='text-align:left; margin-left: 20px; font-size: 28px; color: rgb(255 255 255 / 62%);'>Hover for language & family info</h2>"))
      }
      else if(embedding_ls$prev_embedding == "mds" & embedding_ls$current_embedding == "tsne"){
        p <- plot_graph(color_graph(), dim=3, layout=list(mds, tsne), fpl=400, 
                   main = HTML("<h2 style='text-align:left; margin-left: 20px; font-size: 28px; color: rgb(255 255 255 / 62%);'>Hover for language & family info</h2>"))
      }
    }
    p$elementId <- NULL
    p
    
  })
  
}