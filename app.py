import streamlit as st

DEBUG = False

# set page info
st.set_page_config(
    page_title="Malaysia Population - Data Visualization",
    page_icon="📊",
    layout="wide"
)


def setAllOptions(widget, options):
    if len(widget) == 0:
        widget = options
    return widget


st.title("Malaysia Population - Data Visualization")

# --------------------------------------------------------------------------
# widget on the same row
left, right = st.columns(2, gap="large")
# year range slider
yearSliderLbl = "Year"
selectedYear = left.slider(
    label=yearSliderLbl,
    min_value=1980,
    max_value=2020,
    key="year",
    help="Select a year"
)
# gender multiselector
genderMultiSelectorLbl = "Gender (Blank means Select All)"
genders = sorted(["Male", "Female"])
selectedGenders = right.multiselect(
    label=genderMultiSelectorLbl,
    options=genders,
    key="genders"
)
selectedGenders = setAllOptions(selectedGenders, genders)
# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
# widget on the same row
left, right = st.columns(2, gap="large")
# ethnic multiselector
ethnicMultiSelectorLbl = "Ethnic (Blank means Select All)"
ethnics = sorted(["Bumiputera", "Malay", "Chinese",
                 "Kadazan/Dusun", "Indians", "Bajau", "Murut", "Others"])
selectedEthnics = left.multiselect(
    label=ethnicMultiSelectorLbl,
    options=ethnics,
    key="ethnics"
)
selectedEthnics = setAllOptions(selectedEthnics, ethnics)
# state multiselector
stateMultiSelectorLbl = "State (Blank means Select All)"
states = sorted(["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
                 "Pulau Pinang", "Pahang", "Perak", "Perlis", "Sabah", "Sarawak",
                 "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Labuan",
                 "W.P. Putrajaya"])
selectedStates = right.multiselect(
    label=stateMultiSelectorLbl,
    options=states,
    key="states"
)
selectedStates = setAllOptions(selectedStates, states)
# --------------------------------------------------------------------------

if DEBUG:
    st.write(f"{selectedYear} is selected")
    st.write(f"{selectedEthnics} is selected")
    st.write(f"{selectedGenders} is selected")
    st.write(f"{selectedStates} is selected")
