function(input, output, session) {
  
  observeEvent(input$info_bttn, {
    shinyalert(
      title = "<h2 style = 'font-size: 36px; color: rgb(0,0,0, 95%); margin: 0; margin-bottom:10px;'>LangNet</h2><h3 style = 'font-size: 30px; margin-bottom: 0px; margin-top: 0px;'>Exploring language families through numbers 1 to 10</h3>",
      text = "
<h3 style='font-size: 26px; text-align: justify; margin-top: 0px; color: rgb(0,0,0, 85%);'><b>Welcome!</b></h3>
<p style='font-size: 22px; text-align: justify;'>This app is the culmination of two previous blog posts, one of which is <a href='https://olafmeneses.com/posts/langnet/langfacts/'>On sorting numbers alphabetically in different languages and other absurdities</a>.</p>

<h3 style='font-size: 26px; text-align: justify; color: rgb(0,0,0, 85%);'><b>Explanation</b></h3>
<p style='font-size: 22px; text-align: justify;'>LangNet offers a <strong>3D visualization of language relationships</strong>. Each point represents a language, with edges connecting it to its two nearest languages.
<br><br>The distance between languages is calculated as the sum of normalized <a href='https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance'>Damerau-Levenshtein</a> distances between the number names of languages from 1 to 10. Despite using only this limited information, the results are quite good. If you're curious, check out the blog post <a href='https://olafmeneses.com/posts/langnet/langclust/'>From number names to language families</a>.</p>

<h3 style='font-size: 26px; text-align: justify; color: rgb(0,0,0, 85%);'><b>How to customize the visualization</b></h3>
<p style='font-size: 22px; text-align: justify;'>At the top right corner, you'll find a configuration button. Clicking it reveals a dropdown menu where you can personalize the visualization.

<h3 style='font-size: 26px; text-align: justify; color: rgb(0,0,0, 85%);'><b>Interactivity</b></h3>
<p style='font-size: 22px; text-align: justify;'>Hover over any point to access <strong>information about its family tree</strong>, displayed at the top left of the screen. Below, you'll find details about the <strong>number names in the selected language and its nearest language</strong>.</p>
",
      size = "l",
      closeOnEsc = TRUE,
      closeOnClickOutside = TRUE,
      html = TRUE,
      type = "",
      showConfirmButton = TRUE,
      showCancelButton = FALSE,
      confirmButtonText = "Have fun exploring LangNet!",
      confirmButtonCol = "#1D89FF",
      timer = 0,
      imageUrl = "",
      animation = TRUE
    )
  })
  
  embedding_ls <- reactiveValues(historic = NULL)
  filter_group <- reactive(input$filter_group)
  filter_group_d <- filter_group %>% debounce(500)
  observeEvent(
    {
      input$edges
      input$embedding
      input$color_by_group
      filter_group_d()
    },
    {
      embedding_ls$historic <- c(embedding_ls$historic, input$embedding)
      prev_idx <- ifelse(length(embedding_ls$historic) == 1, 1, length(embedding_ls$historic) - 1)
      embedding_ls$current_embedding <- embedding_ls$historic[length(embedding_ls$historic)]
      embedding_ls$prev_embedding <- embedding_ls$historic[prev_idx]
      runjs('
      if(localStorage.getItem("rotateSpeed") == null){
        var speed = 2.3;
      }else{
        var speed = localStorage.getItem("rotateSpeed");
        var speed = 0.8+(0.25-0.8)/(1+(speed/0.6)**2.75);
      }
      localStorage.setItem("rotateSpeed", speed);
      //console.log("shiny", localStorage.getItem("rotateSpeed"));'
            )
    }
  )

  color_graph <- reactive({
    g_mod <- g
    if (!(input$edges)){
      g_mod <- g_mod-E(g_mod)
    }
    group_num <- as.integer(substr(input$color_by_group, 6, 7))
    V(g_mod)$label <- table_labels[[group_num]]

    g_selected <- vertex_attr(g_mod, input$color_by_group)
    V(g_mod)$group <- g_selected
    V(g_mod)$group <- ifelse(V(g_mod)$group1 %in% filter_group_d(), V(g_mod)$group, NA)
    if(group_num == 1){
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
        p <- plot_graph(color_graph(), dim=3, layout=list(tsne, mds), fpl=1400,
                        main = HTML("<h2 style='text-align:left; margin-left: 20px; font-size: 28px; color: rgb(255 255 255 / 62%);'>Hover for language & family info</h2>"))
      }
      else if(embedding_ls$prev_embedding == "mds" & embedding_ls$current_embedding == "tsne"){
        p <- plot_graph(color_graph(), dim=3, layout=list(mds, tsne), fpl=1400,
                        main = HTML("<h2 style='text-align:left; margin-left: 20px; font-size: 28px; color: rgb(255 255 255 / 62%);'>Hover for language & family info</h2>"))
        
      }
    }
    p$elementId <- NULL
    p

  })
  
  waiter_hide()
}
