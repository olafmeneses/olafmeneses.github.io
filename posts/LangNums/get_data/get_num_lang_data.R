## Downloading, storing and reading the information

url <- "http://www.zompist.com/nums.txt"

download.file(url, destfile = "./data/nums.txt")

nums <- read_file("./data/nums.txt")

# Converting the information into a DataFrame

splitted_nums <- str_split(nums, pattern = regex("^#\\w+\r", multiline = T), simplify = T)[-1]

num_lang_df <- data.frame(lang_id = NA, lang_info = NA, extinct = NA, gt_million = NA,
                          parent_lang_id = NA, group1 = NA, group2 = NA, group3 = NA,
                          group4 = NA, group5 = NA, group6 = NA, group7 = NA)
id <- 1

for (family in splitted_nums){
  family_splitted <- str_split(family, pattern = "\r")[[1]]
  groups <- rep(NA, 7)
  j <- 0
  
  for (line in family_splitted){
    match <- str_match_all(line, regex("^(\\*\\*?[0-9]?)(\\[?\\w+.*\\[?)"))[[1]]
    
    if (!is_empty(match[, 2])){
      if (match[, 2] == "*"){
        i <- 1
      }
      else if (match[, 2] == "**"){
        i <- 2
      }
      else{
        i <- as.integer(str_sub(match[, 2], 2, 2))
      }
      
      if (j > i){
        for(k in j:(i+1)){
          groups[k] <- NA
        }
      }
      
      groups[i] <- match[, 3]
      
      j <- i
    }
    else{
      lang_start_char <- str_match_all(line, regex("^([\\!\\+…])"))[[1]][, 2]
      lang_info <- str_replace(line, regex("^[\\!\\+…]"), "")
      
      extinct <- F
      gt_million <- F
      parent_lang_id <- NA
      
      if (!is_empty(lang_start_char)){
        if (lang_start_char == "+"){  #  + -> Extinct language
          extinct <- T                
        }                             
        else if (lang_start_char == "!"){  #  ! -> +1 Million Speakers
          gt_million <- T
        }
        else if (lang_start_char == "…"){  #  … -> Dialects
          previous_parent_lang_id <- num_lang_df[nrow(num_lang_df), 5] 
          if (is.na(previous_parent_lang_id)){
            parent_lang_id <- id - 1
          }
          else{
            parent_lang_id <- previous_parent_lang_id
          }
          
        }
      }
      
      num_lang_df[nrow(num_lang_df)+1, ] <- c(id, lang_info, extinct, gt_million,
                                              parent_lang_id, groups)
      
      id <- id + 1
    }
  }
}


num_lang_df <- num_lang_df[-1, ] # Eliminate NA row

# Cleaning and adapting the data

not_empty <- function(x){
  return(x != "" & x != "\r" & !is.na(x))
}

clean_num_lang_df <- num_lang_df %>% 
  filter(not_empty(lang_info)) %>% 
  separate(lang_info, into = c("lang_name", "N1", "N2", "N3", "N4", "N5", "N6",
                               "N7", "N8", "N9", "N10"), sep = "\t") %>% 
  filter(not_empty(lang_name)) %>% 
  filter(if_any(.cols = N1:N10, .fns = ~not_empty(.x)))

# Update some rows with fixed values (manually corrected)

source("./manual_fix.R")
clean_num_lang_df <- rows_update(clean_num_lang_df, fixed_langs_df, by = "lang_id")

# Substitute the abbreviated [Number] with the corresponding word

clean_num_lang_df <- clean_num_lang_df %>% 
  mutate(across(N1:N10, ~str_replace_all(.x, "\\[1\\]", N1)),
         across(N1:N10, ~str_replace_all(.x, "\\[2\\]", N2)),
         across(N1:N10, ~str_replace_all(.x, "\\[3\\]", N3)),
         across(N1:N10, ~str_replace_all(.x, "\\[4\\]", N4)),
         across(N1:N10, ~str_replace_all(.x, "\\[5\\]", N5)),
         across(N1:N10, ~str_replace_all(.x, "\\[6\\]", N6)),
         across(N1:N10, ~str_replace_all(.x, "\\[7\\]", N7)),
         across(N1:N10, ~str_replace_all(.x, "\\[8\\]", N8)),
         across(N1:N10, ~str_replace_all(.x, "\\[9\\]", N9)),
         across(N1:N10, ~str_replace_all(.x, "\\[10\\]", N10)),
         across(N1:N10, ~str_replace_all(.x, "[\\*-`‘’\\)\\('—!´¯…']", ""))
         # Eliminate * which means that it is a reconstructed form
         # but also other characters that may modify the ordering
         # (we cannot eliminate unicode characters that may have a non-alphabetical order)
  )

# Put the correct variable types

clean_num_lang_df <- clean_num_lang_df %>% 
  mutate(lang_id = as.integer(lang_id),
         extinct = as.logical(extinct),
         gt_million = as.logical(gt_million),
         parent_lang_id = as.integer(parent_lang_id))

# Normalizing and storing the clean DataFrames

lang_df <- clean_num_lang_df %>% select(lang_id, lang_name, extinct, gt_million,
                                        parent_lang_id, group1:group7)
num_df <- clean_num_lang_df %>% select(lang_id, N1:N10)

write_csv(lang_df, file = "./data/lang_df.csv")
write_csv(num_df, file = "./data/num_df.csv")