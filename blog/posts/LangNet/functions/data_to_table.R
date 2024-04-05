prettify_var_names <- function(var_names){
  var_name_map <- c("lang_id" = "ID", "lang_name" = "Language", "extinct" = "Extinct",
                    "gt_million" = "> 1 million", "parent_lang_id" = "Parent ID",
                    "group1" = "Family", "group2" = "Subfamily 1", "group3" = "Subfamily 2",
                    "group4" = "Subfamily 3", "group5" = "Subfamily 4", "group6" = "Subfamily 5",
                    "group7" = "Subfamily 6")
  
  var_names <- ifelse(var_names %in% names(var_name_map), var_name_map[var_names], var_names)
  return(var_names)
}

show_lang_num <- function(data, ids = T, dom = "lftipr", pageLength = 5){
  if(ids == T){
    df <- lang_df %>% 
      filter(lang_id %in% data) %>% 
      select(lang_id, lang_name, group1) %>% 
      inner_join(num_df, by = join_by(lang_id)) %>% 
      select(-lang_id)
  }
  else{
    df <- data
  }
  
  datatable(df, colnames = prettify_var_names(names(df)), extensions = 'FixedColumns',
            options = 
              list(
                dom = dom,
                pageLength = pageLength,
                lengthMenu = c(5, 10, 15, 25),
                fixedColumns = list(leftColumns = 1),
                columnDefs = list(
                  list(targets = 0, visible = F),
                  list(targets = 1:ncol(df), orderable = FALSE, className = "dt-center")
                )
              )
  )
}


show_table_legend <- function(data, pal, n_per_split = 7, count = T){
  unique_groups <- unique(data)
  num_unique <- length(unique_groups)
  group_count <- as.integer(unname(table(factor(data, levels = unique_groups))))
  color_palette <- color_map(data, pal)
  lighter_palette <- lighten(color_palette, amount = 0.5)
  
  legend_df <- data.frame(unique_groups, count = group_count, color = NA, color_palette, lighter_palette)
  
  nr <- nrow(legend_df)
  n_splits <- ceiling(nr/n_per_split)
  legend_df_splitted <- split(legend_df, rep(1:n_splits, each=n_per_split, length.out=nr))
  
  last_df <- legend_df_splitted[[length(legend_df_splitted)]]
  nr_last_df <- nrow(last_df) 
  if(nr_last_df != n_per_split){
    n_rows_remaining <- n_per_split - nr_last_df
    legend_df_splitted[[length(legend_df_splitted)]] <- last_df %>%
      rows_append(data.frame(color_palette = rep("lightgray", n_rows_remaining),
                             lighter_palette = rep("lightgray", n_rows_remaining)
                             )
                  )
  }
  
  legend_df <- Reduce(cbind, legend_df_splitted)
  
  if(count){
    hidden_cols <- names(legend_df) == "color_palette" | names(legend_df) == "lighter_palette" 
  }
  else{
    hidden_cols <- names(legend_df) == "color_palette" | names(legend_df) == "lighter_palette" | names(legend_df) == "count"
  }
  hidden_cols <- c(0, which(hidden_cols))
  
  palette_cols <- which(names(legend_df) == "color_palette")
  light_palette_cols <- which(names(legend_df) == "lighter_palette")
  
  color_cols <- which(names(legend_df) == "color")
  lightcolor_cols <- which(names(legend_df) %in% c("unique_groups", "count"))
  colnames <- rep(c("Family", "Count", "Color", "pal", "light_pal"), n_splits)
  
  datatable(legend_df, colnames = colnames,
            options = 
              list(
                dom = "t",
                pageLength = 7,
                columnDefs = list(
                  list(targets = hidden_cols, visible = F),
                  list(targets = 1:ncol(legend_df), orderable = FALSE, className = "dt-center")
                )
              )
  ) %>%
    formatStyle(columns = color_cols,
                valueColumns = palette_cols,
                backgroundColor = styleValue()) %>%
    formatStyle(columns = lightcolor_cols,
                valueColumns = rep(light_palette_cols, each = 2),
                backgroundColor = styleValue())
}