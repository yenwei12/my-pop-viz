import streamlit as st
from population_map import populationMap

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
# Filter options
# --------------------------------------------------------------------------
with st.sidebar:
    # year range slider
    yearSliderLbl = "Year"
    selectedYear = st.slider(
        label=yearSliderLbl,
        min_value=1980,
        max_value=2020,
        key="year",
        help="Select a year"
    )

    # state multiselector
    stateMultiSelectorLbl = "State (Blank means Select All)"
    states = sorted(["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
                    "Pulau Pinang", "Pahang", "Perak", "Perlis", "Sabah", "Sarawak",
                     "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Labuan",
                     "W.P. Putrajaya"])
    selectedStates = st.multiselect(
        label=stateMultiSelectorLbl,
        options=states,
        key="states"
    )
    selectedStates = setAllOptions(selectedStates, states)
# --------------------------------------------------------------------------

# message to be sent to js
props = {
    "year": st.session_state.year,
    "states": st.session_state.states,
}

# draw population state graph
st.header("Population Distribution by State in a Country")
st.markdown("**Click** on the legend to display the state with a specific population density. Click again to deselect.")
st.markdown(
    "**Hover** over the states to view detailed population distribution by ethnicity.")
iPopulationMap = populationMap(key="popMap", **props)