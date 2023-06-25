import streamlit as st
from population_map import populationMap
from death_chart import deathChart
from employed_chart import employmentChart
from fertility_life_chart import fertilityLifeChart

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


st.title("Malaysia Demographic - Data Visualization")

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
props = {"year": st.session_state.year}  # message to be sent to js
st.header("Population Distribution by States")
st.markdown("Filter by: **Year (1980 - 2020)**")
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
st.markdown("Filter by: **Year (2001 - 2020)**, **State**")
st.markdown("**Hover** over the bars to view detailed death rate.")
showAll = st.checkbox("Show all states", value=False,
                      key="showAll", on_change=clearState)

if st.session_state.selectedState:
    st.write(f"Selected state: {st.session_state.selectedState}")

props = {
    "year": st.session_state.year,
    "state": st.session_state.selectedState
}
deathChart(key="deathChart", **props)
if not st.session_state.deathChart is None:
    deathSectionHeader = f'<h2>Age Group-Based Mortality Rates for <span style="color: {st.session_state.deathChart[0]}">Male</span> & <span style="color: {st.session_state.deathChart[1]}">Female</span> in Year {st.session_state.year}</h2>'
    container.write(deathSectionHeader, unsafe_allow_html=True)
if st.session_state.year < 2001:
    st.error(f"No data found in year {st.session_state.year}")
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# draw employment population bubble chart
# --------------------------------------------------------------------------
container = st.container()
st.markdown("Filter by: **Year (2001 - 2020)**")
# st.markdown("*Please note that the distribution of employment is spread across the entire country and is not filtered by individual states.*")
props = {"year": st.session_state.year}
employmentChart(key="employmentChart", **props)
if st.session_state.employmentChart is not None:
    deathSectionHeader = f'<h2>Employment Distribution Across Industries for <span style="color: {st.session_state.employmentChart[0]}">Male</span> & <span style="color: {st.session_state.employmentChart[1]}">Female</span> in Year {st.session_state.year}</h2>'
    container.write(deathSectionHeader, unsafe_allow_html=True)
if st.session_state.year < 2001:
    st.error(f"No data found in year {st.session_state.year}")
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# draw fertility rate vs life expectancy
# --------------------------------------------------------------------------
flSectionHeader = f"Fertility Rate and Life Expectancy in Year {st.session_state.year}"
st.header(flSectionHeader)
st.markdown("*Please note that in this graph W.P. Kuala Lumpur, W.P. Labuan & W.P Putrajaya are not counted as individual states.*")
st.markdown("Filter by: **Year (2012 - 2020)**")
st.markdown("**Click** on the legend to highlight the state. Click again to deselect.")
props = {
    "year": st.session_state.year,
    "state": st.session_state.selectedState
}
fertilityLifeChart(key="fertilityLifeChart", **props)
if st.session_state.year < 2012:
    st.error(f"No data found in year {st.session_state.year}")
# --------------------------------------------------------------------------
