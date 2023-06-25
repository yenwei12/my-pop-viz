import streamlit as st
from population_map import populationMap
from death_chart import deathChart
from employed_chart import employmentChart

# init
if "selectedState" not in st.session_state:
    st.session_state.selectedState = "Johor"
if "showAll" not in st.session_state:
    st.session_state.showAll = False

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

def clearState():
    st.session_state.selectedState = ""

def fromMapGetState():
    if st.session_state.showAll:
        clearState()
    elif st.session_state.popMap is not None:
        st.session_state.selectedState = st.session_state.popMap

def fromRadioGetState():
    st.write(st.session_state.radioState)
    if st.session_state.showAll:
        clearState()
    else:
        st.session_state.selectedState = st.session_state.radioState
        st.session_state.popMap = ""

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
        help="Select a year",
        value=2018,
    )

    # state radio
    stateRadioLbl = "State"
    states = sorted(["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
                    "Pulau Pinang", "Pahang", "Perak", "Perlis", "Sabah", "Sarawak",
                     "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Labuan",
                     "W.P. Putrajaya"])
    selectedState = st.radio(
        label=stateRadioLbl,
        options=states,
        key="radioState",
        on_change=fromRadioGetState
    )
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# draw population state map
# --------------------------------------------------------------------------
props = {"year": st.session_state.year} # message to be sent to js
st.header("Population Distribution by State in a Country")
st.markdown("**Click** on the legend to display the state with a specific population density. Click again to deselect.")
st.markdown(
    "**Hover** over the states to view detailed population distribution by ethnicity.")
st.markdown("**Click** on the state to view the death rate for a specific state.")
iPopulationMap = populationMap(key="popMap",  **props)
if iPopulationMap:
    fromMapGetState()
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# draw death rate bar chart
# --------------------------------------------------------------------------
container = st.container()
st.markdown("**Hover** over the bars to view detailed death rate.")
showAll = st.checkbox("Show all states", value=False, key="showAll", on_change=clearState)

if st.session_state.selectedState:
    st.write(f"Selected state: {st.session_state.selectedState}")

props = {
    "year": st.session_state.year,
    "state": st.session_state.selectedState
}
iDeathChart = deathChart(key="deathChart", **props)
if not st.session_state.deathChart is None:
    deathSectionHeader = f'<h2>Age Group-Based Mortality Rates for <span style="color: {st.session_state.deathChart[0]}">Male</span> & <span style="color: {st.session_state.deathChart[1]}">Female</span> in Year {st.session_state.year}</h2>'
    container.write(deathSectionHeader, unsafe_allow_html=True)
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# draw employment population bubble chart
# --------------------------------------------------------------------------
container = st.container()
st.markdown("*Please note that the distribution of employment is spread across the entire country and is not filtered by individual states.*")
props = {"year": st.session_state.year}
employmentChart = employmentChart(key="employmentChart", **props)
if not st.session_state.employmentChart is None:
    deathSectionHeader = f'<h2>Employment Distribution Across Industries for <span style="color: {st.session_state.employmentChart[0]}">Male</span> & <span style="color: {st.session_state.employmentChart[1]}">Female</span> in Year {st.session_state.year}</h2>'
    container.write(deathSectionHeader, unsafe_allow_html=True)
# --------------------------------------------------------------------------
