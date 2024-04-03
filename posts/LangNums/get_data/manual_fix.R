### Manually change languages who follow the rule extracted from the notes on Zompists' web
### "if you see … [2], that means that the number is formed just like the number on its left,
### only using [2] rather [1]. E.g. if you see that 6 is [5] so ɣitne [1] and 7 is … [2], that's equivalent to [5] so ɣitne [2]. It saves a lot of space.
### I wanted to do it automatically, but it doesn't follow that rule strictly :(

wrong_ids <- c(3744, 3894, 3986, 4045, 4112, 4202, 4207, 4223, 4228, 4253, 4254, 4257,
               4259, 4308, 4314, 4318, 4340, 4368, 4389, 4438, 4440, 4445, 4460,
               4524, 4594, 4601, 4636, 4643, 4757, 4924, 4980)

manual_fix_df <- data.frame(lang_id = 0, N6 = "", N7 = "", N8 = "", N9 = "", N10 = "")

manual_fix_df <- rbind(manual_fix_df, c(3744, "tiaskau as", "tiaskau bu", "tiaskau bâs", "tiaskau arungka", "salap"))
manual_fix_df <- rbind(manual_fix_df, c(3894, "uwejá [1] ijúk", "uwejá [2] ijúk", "uwejá [3] ijúk", "uwejá [4] ijúk", "uwejá maí ámua"))
manual_fix_df <- rbind(manual_fix_df, c(3986, "tiuken miaponá teotai", "çagarê miaponá teotai", "ceurauenê miaponá teotai", "kagerelê miaponá teotai", "miata manuerê"))
manual_fix_df <- rbind(manual_fix_df, c(4045, "aiukapi béré", "aiukapi putšaiba", "aiukapi maisiba", "aiukapi bainuaka", "abe wakapi"))
manual_fix_df <- rbind(manual_fix_df, c(4112, "enefebeƚ-llɨmo dacaɨ̀", "enefebeƚ-llɨmo [2]caɨ̀", "enefebeƚ-llɨmo dacaɨ̀ amani", "enefebeƚ-llɨmo [4]caɨ̀", "nagafebellɨ"))  
manual_fix_df <- rbind(manual_fix_df, c(4202, "khoyáfthoa-thak-fathoá", "khoyáfthoa-thakê-tkáno", "khoyáfthoa-thak-lixíno", "khoyáfthoa-thak-[4]", "khoyatkano"))
manual_fix_df <- rbind(manual_fix_df, c(4207, "[1] caicaira", "duuini-caicaira", "[3]-caicaira", "[4]-caicaira", "quinoida"))
manual_fix_df <- rbind(manual_fix_df, c(4223, "isig teèt yaaguit", "isig teèt [2]", "isig teèt [3]", "isig teèt [4]", "isig ukè nislè"))
manual_fix_df <- rbind(manual_fix_df, c(4228, "kʰáfaise yiʔkʰo", "kʰáfaise yiʔkʰo [2]", "kʰáfaise yiʔkʰo khoanífuéʔkʰo", "kʰáfaise yiʔkʰo kʰattufayiʔkʰo", "tive paʔtssi"))
manual_fix_df <- rbind(manual_fix_df, c(4253, "[5] ŋa noboc [1]", "[5] ŋa noboc [2]", "[5] ŋa noboc [3]", "[5] ŋa noboc [4]", "ma ḷijohoc"))
manual_fix_df <- rbind(manual_fix_df, c(4254, "[5] â memâwâ mâ", "[5] â memâwâ [2]", "[5] â memâwâ [3]", "[5] â memâwâ [4]", "mejakec"))
manual_fix_df <- rbind(manual_fix_df, c(4257, "nɯwɯ ema mɯŋ", "nɯwɯ ema mɯŋ æɯhɯc", "nɯwɯ ema mɯŋ haļɯwɯc", "nɯwɯ ema mɯŋ ļɯhɯcŋɯŋ æɯhɯc", "mɯļa ļɯhɯc"))
manual_fix_df <- rbind(manual_fix_df, c(4259, "[5] so ɣitne [1]", "[5] so ɣitne [2]", "[5] so ɣitne karewe", "[5] so ɣitne [4]", "mete etke"))
manual_fix_df <- rbind(manual_fix_df, c(4308, "d-anita [1]-kayagati’ [1]-ko’", "d-anita [1]-kayagati’ [2]", "d-anita [1]-kayagati’ [3]", "d-anita [1]-kayagati’ [4]", "d-anita lole"))
manual_fix_df <- rbind(manual_fix_df, c(4314, "to náentisa káno ’umemaye", "to náentisa tara ’umemaye", "to náentisa tarayekánokirí ’umemaye", "to náentisa tarayetarayekirí ’umemaye", "naya ’taraye empúné"))
manual_fix_df <- rbind(manual_fix_df, c(4318, "angiƚ gi yem mamte", "angiƚ gi yem nam taƚ to", "angiƚ gi yem mam yiyi taƚ ma", "angiƚ gi yem mam ma", "angiƚ gi yemte"))
manual_fix_df <- rbind(manual_fix_df, c(4340, "bédo-[1]", "bédo-[2]", "bédo-[3]", "bédo-[4]", "bìdi-bidima"))
manual_fix_df <- rbind(manual_fix_df, c(4368, "[5] ata p-w--ir-i-daa'nyi [1]", "[5] ata p-w--ir-i-daa'nyi [2]", "[5] ata p-w--ir-i-daa'nyi [2] [1]", "[5] ata p-w--ir-i-daa'nyi [2] [2]", "at--iraai"))
manual_fix_df <- rbind(manual_fix_df, c(4389, "tja’mě rē [1]", "tja’mě rē [2]", "tja’me’rěna běsa", "tja’mě rē kokra", "tja’na bob"))
manual_fix_df <- rbind(manual_fix_df, c(4438, "iboŋ-egele-[1]", "iboŋ-egele-[2]", "iboŋ-egele-[3]", "iboŋ-egele-[4]", "iboŋ-alalī"))
manual_fix_df <- rbind(manual_fix_df, c(4440, "eben gic osahic", "eben gic [2]", "eben gic [3]", "eben gic [4]", "eben naha naha"))
manual_fix_df <- rbind(manual_fix_df, c(4445, "ben sor amulikmo", "ben sor [2]", "ben sor [3]", "ben sor [4]", "ben sorƚsor mo"))
manual_fix_df <- rbind(manual_fix_df, c(4460, "wesaʔa te-a-na", "wesaʔa [2] te-a-na", "wesaʔa [3] te-a-na", "wesaʔa niyawiniyawi te-a-na", "awi-awi usu-a-na"))
manual_fix_df <- rbind(manual_fix_df, c(4524, "danam [1]", "danam irege", "danam oriege", "danam [4]", "dèhèbirège"))
manual_fix_df <- rbind(manual_fix_df, c(4594, "[5] yiyle mak dowo", "[5] yiyle mak [2]", "[5] yiyle mak [3]", "[5] yiyle mak [4]", "yiyle yikiyr"))
manual_fix_df <- rbind(manual_fix_df, c(4601, "[5] sékét [5] kayék [1]", "[5] sékét [5] kayék [2]", "[5] sékét [5] kayék [3]", "[5] sékét [5] kayék [4]", "taaba [2]"))
manual_fix_df <- rbind(manual_fix_df, c(4636, "[5] he hōri ōrom [1]", "[5] he hōri ōrom [2]", "[5] he hōri ōrom [3]", "[5] he hōri ōrom [4]", "a ló ktiek"))
manual_fix_df <- rbind(manual_fix_df, c(4643, "[5]-ko-[1]", "[5]-ko-[2]", "[5]-ko-[3]", "[5]-ko-[4]", "idonok-pakatam"))
manual_fix_df <- rbind(manual_fix_df, c(4757, "marangkua", "maranga kapu", "maranga kapuyama", "maranga kapulanta", "marangka marangka"))
manual_fix_df <- rbind(manual_fix_df, c(4924, "makat̪i ŋaran̪a [1]na", "makat̪i ŋaran [2]", "makat̪i ŋaran [3]", "makat̪i ŋaran [4]", "makat̪i ŋaran̪a [5]"))
manual_fix_df <- rbind(manual_fix_df, c(4980, "[5]kutʸirkan", "[5]kutʸir[2]", "[5]kutʸir[3]", "[5]kutʸir[4]", "pilipili[5]"))

manual_fix_df <- manual_fix_df[-1, ]

wrong_df <- clean_num_lang_df %>%
  filter_at(vars(starts_with("N")), any_vars(grepl("…", .)))

# Automatic fix that can work for almost half of the languages that follow this rule
start_col <- 3
for(i in (start_col+1):(start_col+10)){
  char_detected <- grepl("…", wrong_df[, i])
  for (j in 1:nrow(wrong_df)){
    wrong_df[j, i] <- ifelse(char_detected[j], gsub("…", gsub("\\s*\\[\\d+\\]\\s*", "", wrong_df[j,i-1]), wrong_df[j,i]), wrong_df[j,i])
  }
}

fixed_langs_df <- wrong_df %>%
  rows_update(manual_fix_df, by = "lang_id") %>%
  select(lang_id, starts_with("N"))
