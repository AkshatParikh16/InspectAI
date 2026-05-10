import streamlit as st

st.set_page_config(
    page_title="InspectAI",
    page_icon="🔍",
    layout="wide",
)

page = st.sidebar.radio(
    "Navigation",
    ["Overview", "Run Tests", "Test Results", "Failure Analysis", "Fix Recommendations"],
)

if page == "Overview":
    st.title("🔍 InspectAI")
    st.markdown("**Automated Adversarial Testing and Improvement Pipeline for AI Systems**")
    st.markdown("---")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Runs", 0)
    with col2:
        st.metric("Pass Rate", "0%")
    with col3:
        st.metric("Systems Tested", 0)

    st.markdown("---")
    st.info("Run your first test to start seeing results here.")

elif page == "Run Tests":
    st.header("Run Tests")
    st.markdown("Configure and launch a new test run against your AI system.")

    with st.form("run_tests_form"):
        system_type = st.selectbox(
            "System Type",
            ["RAG", "CUSTOMER_SUPPORT", "MULTI_AGENT"],
            help="The type of AI system you want to test.",
        )
        target_url = st.text_input(
            "Target URL",
            placeholder="https://your-ai-system.example.com/chat",
            help="The endpoint that accepts test inputs.",
        )
        scenario_count = st.slider(
            "Number of Scenarios",
            min_value=5,
            max_value=100,
            value=20,
            help="How many scenarios to generate and run.",
        )
        submitted = st.form_submit_button("Run Tests")

        if submitted:
            st.info("Test execution is not yet implemented. Stay tuned!")

elif page == "Test Results":
    st.header("Test Results")
    st.markdown("View pass/fail outcomes for each scenario in the most recent test run.")
    st.dataframe([])
    st.caption("No results yet — complete a test run to populate this table.")

elif page == "Failure Analysis":
    st.header("Failure Analysis")
    st.markdown("Breakdown of failure types detected across test runs.")
    st.empty()
    st.caption("No failure data yet — complete a test run to see analysis.")

elif page == "Fix Recommendations":
    st.header("Fix Recommendations")
    st.markdown("Prioritized, actionable fixes generated from your failure analysis.")
    st.empty()
    st.caption("No recommendations yet — complete a test run to generate fixes.")
